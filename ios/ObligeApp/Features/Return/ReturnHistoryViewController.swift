import UIKit

class ReturnHistoryViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .plain)
    private let repo = BottleReturnRepository()
    private var returns: [BottleReturn] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "반납 내역"
        view.backgroundColor = .obligeWhite
        tableView.translatesAutoresizingMaskIntoConstraints = false
        tableView.dataSource = self
        tableView.register(ReturnHistoryCell.self, forCellReuseIdentifier: ReturnHistoryCell.reuseID)
        tableView.rowHeight = 72
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
        returns = (try? await repo.fetchReturns(userId: userId)) ?? []
        await MainActor.run { tableView.reloadData() }
    }
}

extension ReturnHistoryViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { returns.count }
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: ReturnHistoryCell.reuseID, for: indexPath) as! ReturnHistoryCell
        cell.configure(with: returns[indexPath.row]); return cell
    }
}
