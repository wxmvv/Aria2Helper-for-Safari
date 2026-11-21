#!/usr/bin/env python3
"""Verify locally exported App Store artifacts without uploading them."""
import hashlib
import json
import pathlib
import plistlib
import re
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]


def run(*args):
    return subprocess.run(args, check=True, capture_output=True).stdout


def read_plist(path):
    return plistlib.loads(path.read_bytes())


def check_quarantine(folder, remove=False):
    """Check copied release products; never change source files or other xattrs."""
    folder = pathlib.Path(folder)
    assert folder.is_dir(), f'Missing release product: {folder}'
    # List names only: do not print attribute values. -s avoids following links.
    names = run('xattr', '-r', '-s', str(folder)).decode()
    affected = [line for line in names.splitlines() if line.endswith(': com.apple.quarantine')]
    if remove:
        if affected:
            run('xattr', '-d', '-r', '-s', 'com.apple.quarantine', str(folder))
        check_quarantine(folder)
        print(f'Removed com.apple.quarantine from {len(affected)} release-product paths.')
    else:
        assert not affected, f'App Store package contains com.apple.quarantine: {affected[:5]}'


def verify(platform):
    version = json.loads((ROOT / 'package.json').read_text())['version']
    project = (ROOT / 'Aria2Helper.xcodeproj/project.pbxproj').read_text()
    build = re.search(r'CURRENT_PROJECT_VERSION = (\d+);', project).group(1)
    output = ROOT / 'build/appstore' / f'{version}-{build}'
    artifact = output / f'export-{platform}' / ('Aria2Helper.pkg' if platform == 'macos' else 'Aria2Helper.ipa')
    assert artifact.is_file(), f'Missing artifact: {artifact}'
    if platform == 'macos':
        signature = run('pkgutil', '--check-signature', str(artifact)).decode()
        assert 'Developer ID Installer' not in signature, 'Mac App Store needs App Store installer signing'
        assert '3rd Party Mac Developer Installer' in signature or 'Mac Installer Distribution' in signature, signature
    with tempfile.TemporaryDirectory(prefix='verify-export-', dir=output) as folder:
        extracted = pathlib.Path(folder) / 'contents'
        if platform == 'macos':
            run('pkgutil', '--expand-full', str(artifact), str(extracted))
            matches = list(extracted.rglob('Aria2Helper.app'))
            assert len(matches) == 1, 'Expected one app inside the installer'
            app = matches[0]
        else:
            run('ditto', '-x', '-k', str(artifact), str(extracted))
            app = extracted / 'Payload/Aria2Helper.app'
        check_quarantine(extracted)
        mac = platform == 'macos'
        contents = app / 'Contents' if mac else app
        ext = contents / 'PlugIns/Aria2Helper Extension.appex'
        ext_contents = ext / 'Contents' if mac else ext
        for bundle, identifier in [(contents, 'cc.wxmvv.Aira2Helper'), (ext_contents, 'cc.wxmvv.Aira2Helper.Extension')]:
            info = read_plist(bundle / 'Info.plist')
            assert info['CFBundleIdentifier'] == identifier
            assert info['CFBundleShortVersionString'] == version
            assert info['CFBundleVersion'] == build
            assert info['ITSAppUsesNonExemptEncryption'] is False
            resources = bundle / 'Resources' if mac else bundle
            privacy = read_plist(resources / 'PrivacyInfo.xcprivacy')
            assert privacy['NSPrivacyTracking'] is False
            actual_bundle = bundle.parent if mac else bundle
            entitlements = plistlib.loads(run('codesign', '-d', '--entitlements', '-', '--xml', str(actual_bundle)))
            assert entitlements.get('get-task-allow', False) is False
            assert entitlements.get('com.apple.security.get-task-allow', False) is False
        run('codesign', '--verify', '--deep', '--strict', str(app))
        resources = ext_contents / 'Resources' if mac else ext_contents
        for name in ['settings.js', 'settings.css', 'settings.html', 'background.js', 'popup.js', 'content.js', 'common/constants.js', 'common/storage.js']:
            assert (resources / name).read_bytes() == (ROOT / 'Shared (Extension)/Resources' / name).read_bytes(), f'Export contains stale {name}'
    report = {'platform': platform, 'version': version, 'build': build, 'artifact': str(artifact), 'sha256': hashlib.sha256(artifact.read_bytes()).hexdigest(), 'signatureAndEntitlementsVerified': True, 'quarantineAttributesAbsent': True, 'uploaded': False}
    (output / f'export-validation-{platform}.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps(report, indent=2))


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] in ['--check-quarantine', '--remove-quarantine']:
        check_quarantine(sys.argv[2], remove=sys.argv[1] == '--remove-quarantine')
        sys.exit(0)
    if len(sys.argv) != 2 or sys.argv[1] not in ['ios', 'macos']:
        sys.exit('Usage: python3 scripts/verify-store-export.py ios|macos')
    verify(sys.argv[1])
