import UIKit

class ProductListViewController: UIViewController {

    private let categoryScroll = UIScrollView()
    private let categoryStack  = UIStackView()
    private let collectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.sectionInset = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        layout.minimumInteritemSpacing = 12
        layout.minimumLineSpacing = 16
        return UICollectionView(frame: .zero, collectionViewLayout: layout)
    }()
    private let spinner = UIActivityIndicatorView(style: .medium)

    private let productRepo = ProductRepository()
    private var categories: [Category] = []
    private var products: [Product] = []
    private var selectedCategoryId: Int?

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "쇼핑"
        view.backgroundColor = .obligePaper
        setupLayout()
        setupCollectionView()
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "bag"), style: .plain,
            target: self, action: #selector(cartTapped)
        )
        navigationItem.rightBarButtonItem?.tintColor = .obligePink
        Task { await loadAll() }
    }

    private func setupLayout() {
        categoryStack.axis = .horizontal
        categoryStack.spacing = 8
        categoryStack.translatesAutoresizingMaskIntoConstraints = false
        categoryScroll.showsHorizontalScrollIndicator = false
        categoryScroll.translatesAutoresizingMaskIntoConstraints = false
        categoryScroll.addSubview(categoryStack)
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        spinner.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(categoryScroll)
        view.addSubview(collectionView)
        view.addSubview(spinner)

        NSLayoutConstraint.activate([
            categoryScroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            categoryScroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            categoryScroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            categoryScroll.heightAnchor.constraint(equalToConstant: 52),

            categoryStack.topAnchor.constraint(equalTo: categoryScroll.topAnchor, constant: 8),
            categoryStack.leadingAnchor.constraint(equalTo: categoryScroll.leadingAnchor, constant: 16),
            categoryStack.trailingAnchor.constraint(equalTo: categoryScroll.trailingAnchor, constant: -16),
            categoryStack.bottomAnchor.constraint(equalTo: categoryScroll.bottomAnchor, constant: -8),
            categoryStack.heightAnchor.constraint(equalTo: categoryScroll.heightAnchor, constant: -16),

            collectionView.topAnchor.constraint(equalTo: categoryScroll.bottomAnchor),
            collectionView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            collectionView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            collectionView.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            spinner.centerYAnchor.constraint(equalTo: view.centerYAnchor),
        ])
    }

    private func setupCollectionView() {
        collectionView.dataSource = self
        collectionView.delegate   = self
        collectionView.register(ProductCell.self, forCellWithReuseIdentifier: ProductCell.reuseID)
        collectionView.backgroundColor = .clear
        let width = (UIScreen.main.bounds.width - 48) / 2
        if let layout = collectionView.collectionViewLayout as? UICollectionViewFlowLayout {
            layout.itemSize = CGSize(width: width, height: width * 1.5)
        }
    }

    @objc private func cartTapped() {
        let vc = CartViewController()
        navigationController?.pushViewController(vc, animated: true)
    }

    private func loadAll() async {
        await MainActor.run { spinner.startAnimating() }
        async let cats  = productRepo.fetchCategories()
        async let prods = productRepo.fetchProducts()
        categories = (try? await cats)  ?? []
        products   = (try? await prods) ?? []
        await MainActor.run {
            buildChips()
            collectionView.reloadData()
            spinner.stopAnimating()
        }
    }

    private func buildChips() {
        categoryStack.arrangedSubviews.forEach { $0.removeFromSuperview() }
        addChip(title: "전체", id: nil)
        categories.forEach { addChip(title: $0.name, id: $0.id) }
        updateChipStyles()
    }

    private func addChip(title: String, id: Int?) {
        var cfg = UIButton.Configuration.filled()
        cfg.title = title
        cfg.cornerStyle = .capsule
        cfg.contentInsets = NSDirectionalEdgeInsets(top: 6, leading: 14, bottom: 6, trailing: 14)
        let btn = UIButton(configuration: cfg)
        btn.tag = id ?? -1
        btn.addTarget(self, action: #selector(categoryTapped(_:)), for: .touchUpInside)
        categoryStack.addArrangedSubview(btn)
    }

    private func updateChipStyles() {
        categoryStack.arrangedSubviews.compactMap { $0 as? UIButton }.forEach { btn in
            let selected = (btn.tag == -1 && selectedCategoryId == nil)
                        || (btn.tag != -1 && btn.tag == selectedCategoryId)
            var cfg = btn.configuration ?? .filled()
            cfg.baseBackgroundColor = selected ? .obligeLime : .obligeWhite
            cfg.baseForegroundColor = .obligeInk
            btn.configuration = cfg
        }
    }

    @objc private func categoryTapped(_ sender: UIButton) {
        selectedCategoryId = sender.tag == -1 ? nil : sender.tag
        updateChipStyles()
        spinner.startAnimating()
        Task {
            products = (try? await productRepo.fetchProducts(categoryId: selectedCategoryId)) ?? []
            await MainActor.run { collectionView.reloadData(); spinner.stopAnimating() }
        }
    }
}

extension ProductListViewController: UICollectionViewDataSource, UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int { products.count }
    func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        let cell = collectionView.dequeueReusableCell(withReuseIdentifier: ProductCell.reuseID, for: indexPath) as! ProductCell
        cell.configure(with: products[indexPath.item])
        return cell
    }
    func collectionView(_ collectionView: UICollectionView, didSelectItemAt indexPath: IndexPath) {
        let vc = ProductDetailViewController()
        vc.product = products[indexPath.item]
        navigationController?.pushViewController(vc, animated: true)
    }
}
