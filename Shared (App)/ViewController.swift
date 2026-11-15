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
typealias PlatformView = UIView
#elseif os(macOS)
import Cocoa
import SafariServices
typealias PlatformViewController = NSViewController
typealias PlatformView = NSView
#endif

let extensionBundleIdentifier = "cc.wxmvv.Aira2Helper.Extension"

class ViewController: PlatformViewController, WKNavigationDelegate, WKScriptMessageHandler {

    @IBOutlet var webView: WKWebView!
    private var glassContainer: PlatformView?

#if os(iOS)
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        installGlassIfAvailable()
    }
#elseif os(macOS)
    override func viewWillAppear() {
        super.viewWillAppear()
        installGlassIfAvailable()
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
        self.webView.scrollView.isScrollEnabled = false
#endif

        self.webView.configuration.userContentController.add(self, name: "controller")

        self.webView.loadFileURL(Bundle.main.url(forResource: "Main", withExtension: "html")!, allowingReadAccessTo: Bundle.main.resourceURL!)
    }

    /// Wrap the container page in the system glass material on iOS 26 / macOS 26.
    private func installGlassIfAvailable() {
        guard glassContainer == nil else { return }
#if os(iOS)
        guard #available(iOS 26.0, *) else { return }
        let effect = UIGlassEffect(style: .regular)
        effect.isInteractive = true
        effect.tintColor = UIColor.tintColor.withAlphaComponent(0.12)
        let container = UIVisualEffectView(effect: effect)
        container.translatesAutoresizingMaskIntoConstraints = false
        container.layer.cornerRadius = 24
        container.layer.cornerCurve = .continuous
        container.clipsToBounds = true
        view.addSubview(container)
        NSLayoutConstraint.activate([
            container.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            container.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
            container.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            container.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -12),
        ])
        webView.removeFromSuperview()
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.isOpaque = false
        webView.backgroundColor = .clear
        webView.scrollView.backgroundColor = .clear
        container.contentView.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: container.contentView.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.contentView.trailingAnchor),
            webView.topAnchor.constraint(equalTo: container.contentView.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.contentView.bottomAnchor),
        ])
        glassContainer = container
#elseif os(macOS)
        guard #available(macOS 26.0, *) else { return }
        let container = NSGlassEffectView()
        container.style = .regular
        container.cornerRadius = 20
        container.tintColor = NSColor.controlAccentColor.withAlphaComponent(0.10)
        if #available(macOS 27.0, *) {
            container.effectIsInteractive = true
        }
        container.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(container)
        NSLayoutConstraint.activate([
            container.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 12),
            container.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -12),
            container.topAnchor.constraint(equalTo: view.topAnchor, constant: 12),
            container.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -12),
        ])
        webView.removeFromSuperview()
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.underPageBackgroundColor = .clear
        container.contentView = webView
        NSLayoutConstraint.activate([
            webView.leadingAnchor.constraint(equalTo: container.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: container.trailingAnchor),
            webView.topAnchor.constraint(equalTo: container.topAnchor),
            webView.bottomAnchor.constraint(equalTo: container.bottomAnchor),
        ])
        glassContainer = container
        // Let the window show the desktop through the glass material.
        view.window?.isOpaque = false
        view.window?.backgroundColor = .clear
#endif
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
#if os(iOS)
        webView.evaluateJavaScript("show('ios')")
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
