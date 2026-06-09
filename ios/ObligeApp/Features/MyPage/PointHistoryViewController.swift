import UIKit

class PointHistoryViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .plain)
    private let repo = PointRepository()
    private var logs: [PointLog] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "포인트 내역"
        view.backgroundColor = .obligeWhite
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
        Task { await load() }
    }

    private func load() async {
        guard let userId = ProfileStore.shared.profile?.id else { return }
        logs = (try? await repo.fetchPointLogs(userId: userId)) ?? []
        await MainActor.run { tableView.reloadData() }
    }
}

extension PointHistoryViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { logs.count }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
        let log = logs[indexPath.row]
        var c = cell.defaultContentConfiguration()
        c.text = log.reason ?? log.logType
        c.secondaryText = log.createdAt.formatted(date: .abbreviated, time: .shortened)
        c.secondaryTextProperties.font = .systemFont(ofSize: 12); c.secondaryTextProperties.color = .secondaryLabel
        let label = UILabel()
        label.text = log.logType == "적립" ? "+\(log.pointChange.formatted())P" : "\(log.pointChange.formatted())P"
        label.font = .systemFont(ofSize: 14, weight: .semibold)
        label.textColor = log.logType == "적립" ? .obligePink : .systemRed
        label.sizeToFit()
        cell.accessoryView = label; cell.selectionStyle = .none; cell.contentConfiguration = c; return cell
    }
}
