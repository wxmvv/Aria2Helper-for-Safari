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
        
        // BUG some bug here notification
        // https://stackoverflow.com/questions/58370550/unusernotificationcenter-notifications-are-not-allowed-for-this-application
        // https://developer.apple.com/forums/thread/764852
        if messageDict?["message"] == "open-notification" {
            var result : Any?
            let center = UNUserNotificationCenter.current()
            center.requestAuthorization(options: [.alert,.sound, .badge,.provisional]) { success, error in
                if success == true {
                    let content = UNMutableNotificationContent()
                    content.title = messageDict?["title"] ?? "no title"
                    content.subtitle = messageDict?["subtitle"] ?? "no subtitle"
                    content.sound = UNNotificationSound.default
                    content.body = messageDict?["body"] ?? "no body"
                    // show this notification one seconds from now
                    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
                    let request = UNNotificationRequest(
                        identifier: UUID().uuidString, content: content, trigger: trigger)
                    center.add(request) { error in
                        print("ok")
                        result = error
                    }
                } else {
                    print("no")
                }
            }
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [ SFExtensionMessageKey: [ "echo": message , "result": result] ]
            } else {
                response.userInfo = [ "message": [ "echo": message, "result": result ] ]
            }
        }
        
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
        
#elseif os(macOS)
        
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

#endif
