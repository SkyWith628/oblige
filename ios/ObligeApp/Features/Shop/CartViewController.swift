import UIKit

class CartViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .insetGrouped)
    private let emptyLabel: UILabel = {
        let l = UILabel()
        l.text = "장바구니가 비어있어요 🛍"
        l.font = .systemFont(ofSize: 16)
        l.textColor = .secondaryLabel
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()
    private let orderButton = ObligePrimaryButton(title: "주문하기")
    private let spinner = UIActivityIndicatorView(style: .medium)

    private let repo = ProductRepository()
    private var items: [CartItem] = []

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "장바구니"
        view.backgroundColor = .obligePaper
        setupLayout()
        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(CartItemCell.self, forCellReuseIdentifier: CartItemCell.reuseID)
        orderButton.addTarget(self, action: #selector(orderTapped), for: .touchUpInside)
        Task { await loadItems() }
    }

    private func setupLayout() {
        tableView.translatesAutoresizingMaskIntoConstraints = false
        spinner.translatesAutoresizingMaskIntoConstraints = false

        let bottomBar = UIView()
        bottomBar.backgroundColor = .obligeWhite
        bottomBar.translatesAutoresizingMaskIntoConstraints = false
        orderButton.translatesAutoresizingMaskIntoConstraints = false
        bottomBar.addSubview(orderButton)

        view.addSubview(tableView)
        view.addSubview(emptyLabel)
        view.addSubview(spinner)
        view.addSubview(bottomBar)

        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: bottomBar.topAnchor),

            emptyLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            emptyLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor),

            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor),

            bottomBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomBar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),
            bottomBar.heightAnchor.constraint(equalToConstant: 80),

            orderButton.leadingAnchor.constraint(equalTo: bottomBar.leadingAnchor, constant: 16),
            orderButton.trailingAnchor.constraint(equalTo: bottomBar.trailingAnchor, constant: -16),
            orderButton.centerYAnchor.constraint(equalTo: bottomBar.centerYAnchor),
            orderButton.heightAnchor.constraint(equalToConstant: 50),
        ])
    }

    private func loadItems() async {
        guard let userId = ProfileStore.shared.profile?.id else { return }
        await MainActor.run { spinner.startAnimating(); emptyLabel.isHidden = true }
        items = (try? await repo.fetchCartItems(userId: userId)) ?? []
        await MainActor.run {
            spinner.stopAnimating()
            tableView.reloadData()
            emptyLabel.isHidden = !items.isEmpty
            orderButton.isEnabled = !items.isEmpty
            updateTitle()
        }
    }

    private func updateTitle() {
        let total = items.reduce(0) { $0 + (($1.product?.price ?? 0) * $1.quantity) }
        let formatted = total == 0 ? "주문하기" : "주문하기 · \(total.formatted())원"
        orderButton.setTitle(formatted, for: .normal)
    }

    @objc private func orderTapped() {
        showToast("주문 기능은 준비 중입니다 🚧")
    }
}

// MARK: - TableView

extension CartViewController: UITableViewDataSource, UITableViewDelegate {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { items.count }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: CartItemCell.reuseID, for: indexPath) as! CartItemCell
        cell.configure(with: items[indexPath.row])
        return cell
    }

    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat { 88 }

    func tableView(_ tableView: UITableView, trailingSwipeActionsConfigurationForRowAt indexPath: IndexPath) -> UISwipeActionsConfiguration? {
        let delete = UIContextualAction(style: .destructive, title: "삭제") { [weak self] _, _, done in
            guard let self else { done(false); return }
            let item = self.items[indexPath.row]
            Task {
                try? await self.repo.removeFromCart(itemId: item.id)
                self.items.remove(at: indexPath.row)
                await MainActor.run {
                    tableView.deleteRows(at: [indexPath], with: .automatic)
                    self.emptyLabel.isHidden = !self.items.isEmpty
                    self.orderButton.isEnabled = !self.items.isEmpty
                    self.updateTitle()
                }
            }
            done(true)
        }
        return UISwipeActionsConfiguration(actions: [delete])
    }
}

// MARK: - CartItemCell

final class CartItemCell: UITableViewCell {
    static let reuseID = "CartItemCell"

    private let productImageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true
        iv.layer.cornerRadius = 8
        iv.backgroundColor = .obligeClay
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()
    private let nameLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 15, weight: .semibold); l.numberOfLines = 2; return l
    }()
    private let priceLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 14); l.textColor = .obligePink; return l
    }()
    private let quantityLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 13); l.textColor = .secondaryLabel; return l
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        let textStack = UIStackView(arrangedSubviews: [nameLabel, priceLabel, quantityLabel])
        textStack.axis = .vertical; textStack.spacing = 4

        let row = UIStackView(arrangedSubviews: [productImageView, textStack])
        row.axis = .horizontal; row.spacing = 12; row.alignment = .center
        row.isLayoutMarginsRelativeArrangement = true
        row.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)
        row.translatesAutoresizingMaskIntoConstraints = false
        contentView.addSubview(row)

        NSLayoutConstraint.activate([
            productImageView.widthAnchor.constraint(equalToConstant: 64),
            productImageView.heightAnchor.constraint(equalToConstant: 64),
            row.topAnchor.constraint(equalTo: contentView.topAnchor),
            row.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            row.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            row.bottomAnchor.constraint(equalTo: contentView.bottomAnchor),
        ])
    }

    required init?(coder: NSCoder) { fatalError() }

    func configure(with item: CartItem) {
        nameLabel.text = item.product?.name ?? "-"
        priceLabel.text = item.product?.formattedPrice ?? ""
        quantityLabel.text = "수량 \(item.quantity)개"
        productImageView.image = nil
        if let url = item.product?.mainImageURL {
            Task {
                guard let (data, _) = try? await URLSession.shared.data(from: url),
                      let img = UIImage(data: data) else { return }
                await MainActor.run { self.productImageView.image = img }
            }
        }
    }
}
