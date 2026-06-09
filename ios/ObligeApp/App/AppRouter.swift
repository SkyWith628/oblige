import UIKit

enum AppRouter {

    static func makeMainTabBar() -> UITabBarController {
        let tab = UITabBarController()
        tab.viewControllers = [
            makeNav(root: HomeViewController(),        title: "홈",      icon: "house.fill"),
            makeNav(root: ProductListViewController(), title: "쇼핑",    icon: "bag.fill"),
            makeNav(root: ReturnGuideViewController(), title: "반납",    icon: "arrow.3.trianglepath"),
            makeNav(root: MyPageViewController(),      title: "마이",    icon: "person.fill"),
        ]
        applyTabBarAppearance(tab.tabBar)
        return tab
    }

    static func makeAuthFlow() -> UINavigationController {
        UINavigationController(rootViewController: LoginViewController())
    }

    static func switchToMain(profile: Profile) {
        ProfileStore.shared.profile = profile
        transition(to: makeMainTabBar())
    }

    static func switchToAuth() {
        ProfileStore.shared.profile = nil
        transition(to: makeAuthFlow())
    }

    // MARK: - Private

    private static func applyTabBarAppearance(_ tabBar: UITabBar) {
        let appearance = UITabBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .obligeWhite

        // 선택된 탭: 핑크
        appearance.stackedLayoutAppearance.selected.iconColor = .obligePink
        appearance.stackedLayoutAppearance.selected.titleTextAttributes = [
            .foregroundColor: UIColor.obligePink,
            .font: UIFont.systemFont(ofSize: 10, weight: .bold)
        ]
        // 미선택 탭: ink 60%
        appearance.stackedLayoutAppearance.normal.iconColor = UIColor.obligeInk.withAlphaComponent(0.4)
        appearance.stackedLayoutAppearance.normal.titleTextAttributes = [
            .foregroundColor: UIColor.obligeInk.withAlphaComponent(0.4),
            .font: UIFont.systemFont(ofSize: 10, weight: .bold)
        ]

        tabBar.standardAppearance = appearance
        tabBar.scrollEdgeAppearance = appearance
        tabBar.layer.borderColor = UIColor.obligeInk.cgColor
        tabBar.layer.borderWidth = 1
    }

    private static func makeNav(root: UIViewController, title: String, icon: String) -> UINavigationController {
        let nav = UINavigationController(rootViewController: root)
        nav.tabBarItem = UITabBarItem(title: title, image: UIImage(systemName: icon), tag: 0)

        // Navigation bar appearance
        let appearance = UINavigationBarAppearance()
        appearance.configureWithOpaqueBackground()
        appearance.backgroundColor = .obligeWhite
        appearance.shadowColor = .obligeInk
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor.obligeInk,
            .font: UIFont.systemFont(ofSize: 17, weight: .bold)
        ]
        nav.navigationBar.standardAppearance = appearance
        nav.navigationBar.scrollEdgeAppearance = appearance
        nav.navigationBar.tintColor = .obligePink

        return nav
    }

    private static func transition(to vc: UIViewController) {
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let window = scene.windows.first else { return }
        UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve) {
            window.rootViewController = vc
        }
    }
}
