//
//  AfilliApp.swift
//  Afilli
//
//  Created by Jake Bass on 10/16/25.
//

import SwiftUI
import CoreData

@main
struct AfilliApp: App {
    let persistenceController = PersistenceController.shared

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.managedObjectContext, persistenceController.container.viewContext)
        }
    }
}
