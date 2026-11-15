//
//  ViewController.swift
//  Shared (App)
//
//  Created by wxm on 3/20/25.
//

import WebKit
import UserNotifications
#if os(iOS)
import UIKit
typealias PlatformViewController = UIViewController
#elseif os(macOS)
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
#endif

let extensionBundleIdentifier = "cc.wxmvv.Aira2Helper.Extension"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!
#if os(iOS)
    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        // The storyboard starts with a fixed WebView frame. Refresh WebKit's
        // viewport once UIKit has resolved the device's safe-area constraints.
        webView.setNeedsLayout()
        webView.layoutIfNeeded()
    }
#elseif os(macOS)
    override func viewDidAppear() {
        super.viewDidAppear()
        // Keep the launcher in a standard system window. Extension appearance
        // experiments must not make the native window/title bar transparent.
        view.window?.isOpaque = true
        view.window?.backgroundColor = .windowBackgroundColor
    }
#endif

    override func viewDidLoad() {
        super.viewDidLoad()

        self.webView.navigationDelegate = self

#if DEBUG
        if #available(macOS 13.3, iOS 16.4, *) {
            self.webView.isInspectable = true
        }
#endif

#if os(iOS)
        view.backgroundColor = .systemBackground
        // Let WebKit paint the document instead of covering it with an opaque backing.
        webView.isOpaque = false
        webView.backgroundColor = .systemBackground
        webView.underPageBackgroundColor = .systemBackground
        webView.scrollView.backgroundColor = .systemBackground
        webView.scrollView.isScrollEnabled = false
        webView.translatesAutoresizingMaskIntoConstraints = false
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            webView.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
        ])
#elseif os(macOS)
        self.webView.underPageBackgroundColor = .windowBackgroundColor
#endif

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(iOS)
        webView.evaluateJavaScript("show('ios')") { _, _ in
            // Recompute the first viewport after the document and platform
            // styles are ready, as well as after native safe-area layout.
            webView.setNeedsLayout()
            webView.layoutIfNeeded()
        }
#elseif os(macOS)
        webView.evaluateJavaScript("show('mac')")

        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            guard let state = state, error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }

            DispatchQueue.main.async {
                if #available(macOS 13, *) {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), true)")
                } else {
                    webView.evaluateJavaScript("show('mac', \(state.isEnabled), false)")
                }
            }
        }
#endif
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
#if os(macOS)
        if (message.body as! String != "open-preferences") {
            return
        }
        
        if (message.body as! String == "test-notification") {
            let center = UNUserNotificationCenter.current()
            let content = UNMutableNotificationContent()
            content.title =  "no title"
            content.subtitle =  "no subtitle"
            content.sound = UNNotificationSound.default
            content.body =  "no body"
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
            let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
            center.add(request) { error in
                if let error = error {
                    print("添加通知失败: \(error.localizedDescription)")
                } else {
                    print("通知添加成功")
                }
            }
        }
        
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            guard error == nil else {
                // Insert code to inform the user that something went wrong.
                return
            }
            
            DispatchQueue.main.async {
                NSApp.terminate(self)
            }
        }
        
#endif
    }

}
