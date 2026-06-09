import UIKit

final class ReturnHistoryCell: UITableViewCell {
    static let reuseID = "ReturnHistoryCell"

    private let iconView: UIImageView = {
        let iv = UIImageView()
        iv.contentMode = .scaleAspectFit
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let numberLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 14, weight: .semibold)
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let detailLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12)
        l.textColor = .secondaryLabel
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let statusBadge: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 11)
        l.textAlignment = .center
        l.layer.cornerRadius = 10
        l.clipsToBounds = true
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let pointLabel: UILabel = {
        let l = UILabel()
        l.font = .systemFont(ofSize: 12, weight: .semibold)
        l.textColor = .obligeGreen
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        [iconView, numberLabel, detailLabel, statusBadge, pointLabel].forEach {
            contentView.addSubview($0)
        }
        NSLayoutConstraint.activate([
            iconView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            iconView.centerYAnchor.constraint(equalTo: contentView.centerYAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 36),
            iconView.heightAnchor.constraint(equalToConstant: 36),

            numberLabel.leadingAnchor.constraint(equalTo: iconView.trailingAnchor, constant: 12),
            numberLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 14),

            detailLabel.leadingAnchor.constraint(equalTo: numberLabel.leadingAnchor),
            detailLabel.topAnchor.constraint(equalTo: numberLabel.bottomAnchor, constant: 4),
            detailLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -14),

            statusBadge.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            statusBadge.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 14),
            statusBadge.widthAnchor.constraint(greaterThanOrEqualToConstant: 70),
            statusBadge.heightAnchor.constraint(equalToConstant: 22),

            pointLabel.trailingAnchor.constraint(equalTo: statusBadge.trailingAnchor),
            pointLabel.topAnchor.constraint(equalTo: statusBadge.bottomAnchor, constant: 4),
        ])
    }

    func configure(with item: BottleReturn) {
        numberLabel.text = item.returnNumber
        detailLabel.text = "\(item.bottleCount)개 · \(item.returnMethod.label) · "
            + item.createdAt.formatted(date: .abbreviated, time: .omitted)

        let (color, text): (UIColor, String)
        switch item.returnStatus {
        case .received:   (color, text) = (.systemOrange, item.returnStatus.rawValue)
        case .inspecting: (color, text) = (.systemBlue,   item.returnStatus.rawValue)
        case .completed:  (color, text) = (.systemGreen,  item.returnStatus.rawValue)
        case .rejected:   (color, text) = (.systemRed,    item.returnStatus.rawValue)
        }

        statusBadge.text = "  \(text)  "
        statusBadge.textColor = color
        statusBadge.backgroundColor = color.withAlphaComponent(0.1)

        iconView.image = UIImage(systemName: item.returnStatus == .completed ? "checkmark.circle.fill" : "clock.fill")
        iconView.tintColor = color

        pointLabel.text = item.approvedPoint > 0 ? "+\(item.approvedPoint.formatted())P" : ""
    }
}
