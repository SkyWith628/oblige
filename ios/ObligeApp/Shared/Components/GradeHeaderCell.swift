import UIKit

final class GradeHeaderCell: UITableViewCell {
    static let reuseID = "GradeHeaderCell"

    private let gradeLabel = UILabel()
    private let nameLabel  = UILabel()
    private let pointLabel = UILabel()
    private let progressView = UIProgressView(progressViewStyle: .default)
    private let progressLabel = UILabel()

    override init(style: UITableViewCell.CellStyle, reuseIdentifier: String?) {
        super.init(style: style, reuseIdentifier: reuseIdentifier)
        setup()
    }

    required init?(coder: NSCoder) {
        super.init(coder: coder)
        setup()
    }

    private func setup() {
        gradeLabel.font = .systemFont(ofSize: 22, weight: .bold)
        nameLabel.font = .systemFont(ofSize: 14)
        nameLabel.textColor = .secondaryLabel
        pointLabel.font = .systemFont(ofSize: 20, weight: .bold)
        pointLabel.textColor = .obligePink
        pointLabel.textAlignment = .right
        progressView.progressTintColor = .obligeLime
        progressView.trackTintColor = UIColor.obligeInk.withAlphaComponent(0.1)
        progressLabel.font = .systemFont(ofSize: 12)
        progressLabel.textColor = .secondaryLabel
        progressLabel.textAlignment = .right

        [gradeLabel, nameLabel, pointLabel, progressView, progressLabel].forEach {
            $0.translatesAutoresizingMaskIntoConstraints = false
            contentView.addSubview($0)
        }

        NSLayoutConstraint.activate([
            gradeLabel.topAnchor.constraint(equalTo: contentView.topAnchor, constant: 16),
            gradeLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),

            pointLabel.centerYAnchor.constraint(equalTo: gradeLabel.centerYAnchor),
            pointLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            pointLabel.leadingAnchor.constraint(greaterThanOrEqualTo: gradeLabel.trailingAnchor, constant: 8),

            nameLabel.topAnchor.constraint(equalTo: gradeLabel.bottomAnchor, constant: 4),
            nameLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),

            progressView.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 12),
            progressView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor, constant: 16),
            progressView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),

            progressLabel.topAnchor.constraint(equalTo: progressView.bottomAnchor, constant: 6),
            progressLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor, constant: -16),
            progressLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor, constant: -16),
        ])
    }

    func configure(with profile: Profile) {
        let current = GradeRule.current(for: profile)
        let next    = GradeRule.next(for: profile)

        gradeLabel.text = "\(current.icon) \(current.grade)"
        nameLabel.text  = "\(profile.name)님"

        let f = NumberFormatter(); f.numberStyle = .decimal
        pointLabel.text = (f.string(from: NSNumber(value: profile.point)) ?? "\(profile.point)") + " P"

        if let next = next {
            let range = Float(next.minReturnCount - current.minReturnCount)
            let done  = Float(profile.bottleReturnCount - current.minReturnCount)
            progressView.setProgress(done / range, animated: false)
            let remain = next.minReturnCount - profile.bottleReturnCount
            progressLabel.text = "\(next.icon) \(next.grade)까지 \(remain)개"
        } else {
            progressView.setProgress(1.0, animated: false)
            progressLabel.text = "최고 등급 달성! 🎉"
        }
    }
}
