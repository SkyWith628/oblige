import UIKit

final class ProductCell: UICollectionViewCell {
    static let reuseID = "ProductCell"

    private let artView: UIView = {
        let v = UIView()
        v.backgroundColor = .obligeMint
        v.layer.cornerRadius = ODS.radiusCard
        v.layer.borderColor = UIColor.obligeInk.cgColor
        v.layer.borderWidth = 1
        v.clipsToBounds = true
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let imageView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFill
        iv.clipsToBounds = true
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let refillBadge: UILabel = {
        let l = UILabel()
        l.text = "REFILL"
        l.font = .systemFont(ofSize: 9, weight: .bold)
        l.textColor = .obligeInk
        l.backgroundColor = .obligeLime
        l.textAlignment = .center
        l.layer.cornerRadius = 10
        l.layer.borderColor = UIColor.obligeInk.cgColor
        l.layer.borderWidth = 1
        l.clipsToBounds = true
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let nameLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .bold)
        l.textColor = .obligeInk
        l.numberOfLines = 2
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let priceLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 13, weight: .bold)
        l.textColor = .obligeInk
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let pointLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 11, weight: .bold)
        l.textColor = .obligePink
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private static let artColors: [UIColor] = [
        .obligeMint, UIColor(hex: "#ffd5ea"), .obligeSky,
        .obligeClay, UIColor(hex: "#f7e9a9"), UIColor(hex: "#d7ceff")
    ]

    override init(frame: CGRect) { super.init(frame: frame); setup() }
    required init?(coder: NSCoder) { super.init(coder: coder); setup() }

    private func setup() {
        contentView.backgroundColor = .obligeWhite
        contentView.layer.cornerRadius = ODS.radiusCard
        contentView.layer.borderColor = UIColor.obligeInk.cgColor
        contentView.layer.borderWidth = 1
        contentView.layer.shadowColor = UIColor.obligeInk.cgColor
        contentView.layer.shadowOpacity = 1
        contentView.layer.shadowRadius = 0
        contentView.layer.shadowOffset = CGSize(width: 4, height: 4)
        contentView.layer.masksToBounds = false

        artView.addSubview(imageView)
        contentView.addSubview(artView)
        contentView.addSubview(refillBadge)
        contentView.addSubview(nameLabel)
        contentView.addSubview(priceLabel)
        contentView.addSubview(pointLabel)

        NSLayoutConstraint.activate([
            artView.topAnchor.constraint(equalTo: contentView.topAnchor),
            artView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
            artView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
            artView.heightAnchor.constraint(equalToConstant: 110),

            imageView.topAnchor.constraint(equalTo: artView.topAnchor),
            imageView.leadingAnchor.constraint(equalTo: artView.leadingAnchor),
            imageView.trailingAnchor.constraint(equalTo: artView.trailingAnchor),
            imageView.bottomAnchor.constraint(equalTo: artView.bottomAnchor),

            refillBadge.topAnchor.constraint(equalTo: artView.topAnchor, constant: 8),
            refillBadge.leadingAnchor.constraint(equalTo: artView.leadingAnchor, constant: 8),
            refillBadge.widthAnchor.constraint(equalToConstant: 46),
            refillBadge.heightAnchor.constraint(equalToConstant: 20),

            nameLabel.topAnchor.constraint(equalTo: artView.bottomAnchor, constant: 10),
            nameLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 10),
            nameLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -10),

            priceLabel.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 6),
            priceLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 10),

            pointLabel.topAnchor.constraint(equalTo: priceLabel.bottomAnchor, constant: 2),
            pointLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 10),
        ])
    }

    func configure(with product: Product) {
        nameLabel.text  = product.name
        priceLabel.text = product.formattedPrice
        pointLabel.text = "+\(product.price / 30)P 반납 적립"
        imageView.image = nil
        artView.backgroundColor = Self.artColors[abs(product.id) % Self.artColors.count]

        if let url = product.mainImageURL {
            Task {
                guard let (data, _) = try? await URLSession.shared.data(from: url),
                      let img = UIImage(data: data) else { return }
                await MainActor.run { self.imageView.image = img }
            }
        }
    }
}
