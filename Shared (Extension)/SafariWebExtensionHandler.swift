//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by wxm on 3/20/25.
//

import SafariServices
import os.log
import UserNotifications
import Foundation

#if os(iOS)
import UIKit
import UniformTypeIdentifiers // 用于文件类型

#elseif os(macOS)
import AppKit

#endif



class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {
    
    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem
        
        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }
        
        
        // init response
        let response = NSExtensionItem()
        // init Message
        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }
        
        // sendNativeMessage API
        let messageDict = message as? [String: String]
        
        
        
#if os(iOS)
        if messageDict?["message"] == "get-color" {
            // 在 iOS 中使用 UIColor 的 dynamic system colors
            let accentColor = UIColor.tintColor // 或其他系统颜色如 .systemBlue
            var red: CGFloat = 0
            var green: CGFloat = 0
            var blue: CGFloat = 0
            var alpha: CGFloat = 0
            
            accentColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
            
            let rgba = UIColorToRGBA(rgbColor: accentColor)
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [
                    "echo": message,
                    "result": ["r": rgba.r, "g": rgba.g, "b": rgba.b, "a": rgba.a,"device":"ios"]
                ]]
            } else {
                response.userInfo = [ "message": [
                    "echo": message,
                    "result": ["r": rgba.r, "g": rgba.g, "b": rgba.b, "a": rgba.a,"device":"ios"]
                ]]
            }
        }
        if messageDict?["message"] == "select-file" {
            let filePath = messageDict?["url"] ?? ""
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": "ios"] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": "ios" ] ]
            }
        }
        
#elseif os(macOS)
        if messageDict?["message"] == "select-file" {
            let filePath = messageDict?["url"] ?? ""
            // activateFileViewerSelecting(_:) This also works, but it doesn't return any value
            let result = NSWorkspace.shared.selectFile(filePath as String?, inFileViewerRootedAtPath: filePath)
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": result ] ]
            }
        }
        
        
        if messageDict?["message"] == "get-color" {
            let accentColor = NSColor.controlAccentColor
            let accentRgb = accentColor.usingColorSpace(.sRGB)
            let rgba = NSColorToRGBA(rgbColor: accentRgb ?? NSColor(red: 98, green: 187, blue: 68, alpha: 0.8) )
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": ["r":rgba.r , "g":rgba.g , "b":rgba.b , "a":rgba.a, "device" : "macos"]] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": ["r":rgba.r , "g":rgba.g , "b":rgba.b , "a":rgba.a, "device" : "macos"] ] ]
            }
        }
        
        
        if messageDict?["message"] == "open-notification" {
            var result : Any?
            let center = UNUserNotificationCenter.current()
            let content = UNMutableNotificationContent()
            content.title = messageDict?["title"] ?? "no title"
            content.subtitle = messageDict?["subtitle"] ?? "no subtitle"
            content.sound = UNNotificationSound.default
            content.body = messageDict?["body"] ?? "no body"
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(1, 1), repeats: false)
            let request = UNNotificationRequest(identifier: UUID().uuidString, content: content, trigger: trigger)
            //
            //            center.requestAuthorization(options: [.alert,.sound, .badge,.provisional]) { success, error in
            //                if success == true {
            //                    center.add(request) { error in
            //                        if error != nil {
            //                            result = error?.localizedDescription
            //                        }
            //                    }
            //                }
            //            }
            //            if #available(iOS 15.0, macOS 11.0, *) {
            //                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result] ]
            //            } else {
            //                response.userInfo = [ "message": [ "echo": message, "result": result ] ]
            //            }
            //
            
            
            
            //             同步检查权限
            var isAuthorized: Bool = false
            let authSemaphore = DispatchSemaphore(value: 0)
            center.getNotificationSettings { settings in
                isAuthorized = settings.authorizationStatus == .authorized
                authSemaphore.signal()
            }
            authSemaphore.wait()
            
            //             同步请求权限
            var reqAuth = ""
            let reqAuthSemaphore = DispatchSemaphore(value: 0)
            center.requestAuthorization(options: [.alert, .sound, .badge, .provisional]) { granted, error in
                if granted {
                    print("权限请求成功")
                } else if let error = error {
                    print("权限请求失败: \(error.localizedDescription)")
                    reqAuth = error.localizedDescription
                } else {
                    print("权限被用户拒绝")
                }
                reqAuthSemaphore.signal()
            }
            reqAuthSemaphore.wait()
            
            //             同步发送通知
            let semaphore = DispatchSemaphore(value: 0)
            center.add(request) { error in
                if let error = error {
                    print("添加通知失败: \(error.localizedDescription)")
                    result = error.localizedDescription
                    
                } else {
                    print("通知添加成功")
                    result = "Add notification success"
                }
                semaphore.signal()
            }
            semaphore.wait()
            
            //             返回
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result , "auth": isAuthorized , "reqAuth": reqAuth] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": result ,"auth": isAuthorized , "reqAuth": reqAuth] ]
            }
            
        }
        
#endif
        
        // log
        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")
        
        context.completeRequest(returningItems: [ response ], completionHandler: nil)
    }
    
}



#if os(iOS)

func UIColorToRGBA(rgbColor: UIColor) -> (r: Int, g: Int, b: Int, a: Int) {
    var red: CGFloat = 0
    var green: CGFloat = 0
    var blue: CGFloat = 0
    var alpha: CGFloat = 0
    
    rgbColor.getRed(&red, green: &green, blue: &blue, alpha: &alpha)
    
    let red255 = Int(red * 255)
    let green255 = Int(green * 255)
    let blue255 = Int(blue * 255)
    let alpha255 = Int(alpha * 255)
    
    return (red255, green255, blue255, alpha255)
}


#elseif os(macOS)
func NSColorToRGBA(rgbColor: NSColor) -> (r: Int, g: Int, b: Int, a: Int) {
    // 提取RGB分量
    let red = rgbColor.redComponent
    let green = rgbColor.greenComponent
    let blue = rgbColor.blueComponent
    let alpha = rgbColor.alphaComponent
    
    // 转换为0-255范围
    let red255 = Int(red * 255)
    let green255 = Int(green * 255)
    let blue255 = Int(blue * 255)
    let alpha255 = Int(alpha * 255)
    
    return (red255, green255, blue255, alpha255)
}

func requestNotificationPermissionSynchronously() -> (success: Bool, error: Error?) {
    let center = UNUserNotificationCenter.current()
    var success = false
    var authError: Error?
    
    let semaphore = DispatchSemaphore(value: 0)
    
    center.requestAuthorization(options: [.alert, .sound, .badge, .provisional]) { granted, error in
        success = granted
        authError = error
        if granted {
            print("权限请求成功")
        } else if let error = error {
            print("权限请求失败: \(error.localizedDescription)")
        } else {
            print("权限被用户拒绝")
        }
        semaphore.signal()
    }
    
    // 等待异步操作完成
    semaphore.wait()
    
    return (success, authError)
}

#endif


