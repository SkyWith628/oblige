import UIKit

class ReturnGuideViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .insetGrouped)
    private let repo = BottleReturnRepository()
    private var returns: [BottleReturn] = []

    private enum Section: Int, CaseIterable {
        case cycle, methods, notice, history
        var title: String? {
            switch self {
            case .cycle: return nil
            case .methods: return "반납 방법"
            case .notice: return "주의사항"
            case .history: return "최근 반납 내역"
            }
        }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "공병 반납"
        view.backgroundColor = .obligePaper
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.delegate   = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        tableView.register(ReturnHistoryCell.self, forCellReuseIdentifier: ReturnHistoryCell.reuseID)
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "plus.circle.fill"), style: .plain,
            target: self, action: #selector(submitTapped)
        )
        navigationItem.rightBarButtonItem?.tintColor = .obligePink
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        Task { await loadReturns() }
    }

    private func loadReturns() async {
        guard let userId = ProfileStore.shared.profile?.id else { return }
        returns = (try? await repo.fetchReturns(userId: userId)) ?? []
        await MainActor.run { tableView.reloadData() }
    }

    @objc private func submitTapped() {
        let vc = ReturnSubmitViewController()
        let nav = UINavigationController(rootViewController: vc)
        nav.modalPresentationStyle = .pageSheet
        present(nav, animated: true)
    }
}

extension ReturnGuideViewController: UITableViewDataSource, UITableViewDelegate {
    func numberOfSections(in tableView: UITableView) -> Int { Section.allCases.count }
    func tableView(_ tableView: UITableView, titleForHeaderInSection section: Int) -> String? { Section(rawValue: section)?.title }
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        switch Section(rawValue: section)! {
        case .cycle: return 1
        case .methods: return BottleReturn.ReturnMethod.allCases.count
        case .notice: return 1
        case .history: return returns.isEmpty ? 1 : min(returns.count, 3)
        }
    }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        switch Section(rawValue: indexPath.section)! {
        case .cycle:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            var c = cell.defaultContentConfiguration()
            c.text = "비건 구매 → 공병 준비 → 반납 & 포인트 → 리필 혜택 → 재사용"
            c.textProperties.font = .systemFont(ofSize: 13); c.textProperties.color = .secondaryLabel; c.textProperties.numberOfLines = 0
            cell.contentConfiguration = c; cell.selectionStyle = .none; return cell
        case .methods:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            let m = BottleReturn.ReturnMethod.allCases[indexPath.row]
            var c = cell.defaultContentConfiguration()
            c.image = UIImage(systemName: m == .delivery ? "shippingbox.fill" : "mappin.circle.fill")
            c.imageProperties.tintColor = .obligePink
            c.text = m.label
            c.secondaryText = m == .delivery ? "택배 박스 신청 후 수거" : "매장 내 전용 수거함 투입"
            cell.contentConfiguration = c; cell.selectionStyle = .none; return cell
        case .notice:
            let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
            var c = cell.defaultContentConfiguration()
            c.text = "• 내용물을 완전히 비우고 세척한 공병만 반납 가능\n• 파손 용기는 포인트 적립 제외\n• 검수 후 1~3일 내 포인트 적립"
            c.textProperties.font = .systemFont(ofSize: 13); c.textProperties.color = .secondaryLabel; c.textProperties.numberOfLines = 0
            cell.contentConfiguration = c; cell.selectionStyle = .none; return cell
        case .history:
            if returns.isEmpty {
                let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
                var c = cell.defaultContentConfiguration()
                c.text = "반납 내역이 없습니다"; c.textProperties.color = .secondaryLabel; c.textProperties.alignment = .center
                cell.contentConfiguration = c; cell.selectionStyle = .none; return cell
            }
            let cell = tableView.dequeueReusableCell(withIdentifier: ReturnHistoryCell.reuseID, for: indexPath) as! ReturnHistoryCell
            cell.configure(with: returns[indexPath.row]); return cell
        }
    }
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        indexPath.section == Section.history.rawValue && !returns.isEmpty ? 72 : UITableView.automaticDimension
    }
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        guard Section(rawValue: indexPath.section) == .history, !returns.isEmpty else { return }
        let vc = ReturnHistoryViewController()
        navigationController?.pushViewController(vc, animated: true)
    }
}
