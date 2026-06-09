import UIKit

class MyPageViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .insetGrouped)

    private enum Section: Int, CaseIterable {
        case header, activity, grades, account
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "마이페이지"
        view.backgroundColor = .obligePaper
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate   = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        tableView.register(GradeHeaderCell.self, forCellReuseIdentifier: GradeHeaderCell.reuseID)
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        tableView.reloadData()
    }
}

extension MyPageViewController: UITableViewDataSource, UITableViewDelegate {
    func numberOfSections(in tableView: UITableView) -> Int { Section.allCases.count }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch Section(rawValue: section)! {
        case .header: return 1
        case .activity: return 2
        case .grades: return GradeRule.all.count
        case .account: return 1
        }
    }
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? {
        switch Section(rawValue: section)! {
        case .activity: return "활동"
        case .grades: return "등급 혜택"
        default: return nil
        }
    }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        switch Section(rawValue: indexPath.section)! {
        case .header:
            let cell = tableView.dequeueReusableCell(withIdentifier: GradeHeaderCell.reuseID, for: indexPath) as! GradeHeaderCell
            if let p = ProfileStore.shared.profile { cell.configure(with: p) }
            cell.selectionStyle = .none; return cell
        case .activity:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            var c = cell.defaultContentConfiguration()
            c.image = UIImage(systemName: indexPath.row == 0 ? "arrow.3.trianglepath" : "star.fill")
            c.imageProperties.tintColor = .obligePink
            c.text = indexPath.row == 0 ? "공병 반납 내역" : "포인트 내역"
            cell.contentConfiguration = c; cell.accessoryType = .disclosureIndicator; return cell
        case .grades:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            let rule = GradeRule.all[indexPath.row]
            let cur  = ProfileStore.shared.profile?.grade ?? "Seed"
            var c = cell.defaultContentConfiguration()
            c.text = "\(rule.icon) \(rule.grade)\(rule.grade == cur ? "  ✓" : "")"
            c.secondaryText = rule.benefit
            c.secondaryTextProperties.font = .systemFont(ofSize: 12); c.secondaryTextProperties.color = .secondaryLabel
            cell.contentConfiguration = c; cell.selectionStyle = .none
            cell.alpha = rule.grade == cur ? 1.0 : 0.5; return cell
        case .account:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            var c = cell.defaultContentConfiguration()
            c.image = UIImage(systemName: "rectangle.portrait.and.arrow.right")
            c.imageProperties.tintColor = .systemRed
            c.text = "로그아웃"; c.textProperties.color = .systemRed
            cell.contentConfiguration = c; return cell
        }
    }
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        indexPath.section == 0 ? 120 : UITableView.automaticDimension
    }
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch Section(rawValue: indexPath.section)! {
        case .activity:
            let vc: UIViewController = indexPath.row == 0 ? ReturnHistoryViewController() : PointHistoryViewController()
            navigationController?.pushViewController(vc, animated: true)
        case .account:
            let alert = UIAlertController(title: "로그아웃", message: "정말 로그아웃하시겠어요?", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "로그아웃", style: .destructive) { _ in
                Task {
                    try? await AuthRepository().signOut()
                    await MainActor.run {
                        ProfileStore.shared.profile = nil
                        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                              let window = scene.windows.first else { return }
                        UIView.transition(with: window, duration: 0.3, options: .transitionCrossDissolve) {
                            window.rootViewController = AppRouter.makeAuthFlow()
                        }
                    }
                }
            })
            alert.addAction(UIAlertAction(title: "취소", style: .cancel))
            present(alert, animated: true)
        default: break
        }
    }
}
