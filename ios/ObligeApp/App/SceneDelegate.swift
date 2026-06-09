import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else { return }
        window = UIWindow(windowScene: windowScene)
        window?.rootViewController = SplashViewController()
        window?.makeKeyAndVisible()

        Task {
            let profile = await AuthRepository().currentSession()
            await MainActor.run {
                if let profile {
                    ProfileStore.shared.profile = profile
                    self.window?.rootViewController = AppRouter.makeMainTabBar()
                } else {
                    self.window?.rootViewController = AppRouter.makeAuthFlow()
                }
            }
        }
    }
}
