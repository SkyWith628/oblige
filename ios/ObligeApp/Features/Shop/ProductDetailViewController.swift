import UIKit

class ProductDetailViewController: UIViewController {

    var product: Product?
    private var quantity = 1
    private let productRepo = ProductRepository()

    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true
        iv.backgroundColor = .obligeClay
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()
    private let nameLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 20, weight: .bold); l.numberOfLines = 2; return l
    }()
    private let priceLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 18, weight: .semibold); l.textColor = .obligePink; return l
    }()
    private let descLabel: UILabel = {
        let l = UILabel(); l.font = .systemFont(ofSize: 14); l.textColor = .secondaryLabel; l.numberOfLines = 0; return l
    }()
    private let stepper: UIStepper = {
        let s = UIStepper(); s.minimumValue = 1; s.maximumValue = 99; s.value = 1; return s
    }()
    private let stepperLabel: UILabel = {
        let l = UILabel(); l.text = "1개"; l.font = .systemFont(ofSize: 16, weight: .medium); return l
    }()
    private let cartButton = ObligePrimaryButton(title: "장바구니 담기")

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .obligeWhite
        setupLayout()
        stepper.addTarget(self, action: #selector(stepperChanged), for: .valueChanged)
        cartButton.addTarget(self, action: #selector(cartTapped), for: .touchUpInside)
        configureUI()
    }

    private func setupLayout() {
        let scroll = UIScrollView()
        scroll.translatesAutoresizingMaskIntoConstraints = false

        let infoStack = UIStackView(arrangedSubviews: [nameLabel, priceLabel, descLabel])
        infoStack.axis = .vertical; infoStack.spacing = 8
        infoStack.isLayoutMarginsRelativeArrangement = true
        infoStack.layoutMargins = UIEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)

        let contentStack = UIStackView(arrangedSubviews: [imageView, infoStack])
        contentStack.axis = .vertical
        contentStack.translatesAutoresizingMaskIntoConstraints = false

        view.addSubview(scroll)
        scroll.addSubview(contentStack)

        let stepperRow = UIStackView(arrangedSubviews: [stepperLabel, stepper, cartButton])
        stepperRow.axis = .horizontal; stepperRow.spacing = 12; stepperRow.alignment = .center
        stepperRow.isLayoutMarginsRelativeArrangement = true
        stepperRow.layoutMargins = UIEdgeInsets(top: 12, left: 16, bottom: 12, right: 16)

        let bottomBar = UIView()
        bottomBar.backgroundColor = .obligeWhite
        bottomBar.translatesAutoresizingMaskIntoConstraints = false
        stepperRow.translatesAutoresizingMaskIntoConstraints = false
        bottomBar.addSubview(stepperRow)
        view.addSubview(bottomBar)

        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: bottomBar.topAnchor),

            contentStack.topAnchor.constraint(equalTo: scroll.topAnchor),
            contentStack.leadingAnchor.constraint(equalTo: scroll.leadingAnchor),
            contentStack.trailingAnchor.constraint(equalTo: scroll.trailingAnchor),
            contentStack.bottomAnchor.constraint(equalTo: scroll.bottomAnchor),
            contentStack.widthAnchor.constraint(equalTo: scroll.widthAnchor),

            imageView.heightAnchor.constraint(equalToConstant: 300),

            bottomBar.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bottomBar.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bottomBar.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor),

            stepperRow.topAnchor.constraint(equalTo: bottomBar.topAnchor),
            stepperRow.leadingAnchor.constraint(equalTo: bottomBar.leadingAnchor),
            stepperRow.trailingAnchor.constraint(equalTo: bottomBar.trailingAnchor),
            stepperRow.bottomAnchor.constraint(equalTo: bottomBar.bottomAnchor),
            stepperRow.heightAnchor.constraint(equalToConstant: 72),
        ])
    }

    private func configureUI() {
        guard let product else { return }
        title = product.name
        nameLabel.text  = product.name
        priceLabel.text = product.formattedPrice
        descLabel.text  = product.description
        if let url = product.mainImageURL {
            Task {
                guard let (data, _) = try? await URLSession.shared.data(from: url),
                      let img = UIImage(data: data) else { return }
                await MainActor.run { self.imageView.image = img }
            }
        }
    }

    @objc private func stepperChanged() {
        quantity = Int(stepper.value)
        stepperLabel.text = "\(quantity)개"
    }

    @objc private func cartTapped() {
        guard let product, let userId = ProfileStore.shared.profile?.id else { return }
        Task {
            do {
                try await productRepo.addToCart(userId: userId, productId: product.id, quantity: quantity)
                await MainActor.run { self.showToast("장바구니에 담았습니다 🛍") }
            } catch {
                await MainActor.run { self.showToast(error.localizedDescription) }
            }
        }
    }
}
