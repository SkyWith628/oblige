import UIKit

class SplashViewController: UIViewController {

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .obligeInk
        setupLayout()
    }

    private func setupLayout() {
        // ── Kicker chips ─────────────────────────────────────────────
        let chipRow = UIStackView(arrangedSubviews: [
            ObligeChip(text: "VEGAN BEAUTY",  background: .obligeLime),
            ObligeChip(text: "RETURN & EARN", background: UIColor(hex: "#ffd5ea")),
            ObligeChip(text: "GEN Z READY",  background: .obligeSky),
        ])
        chipRow.axis = .horizontal; chipRow.spacing = 8; chipRow.alignment = .center

        // ── Logo card ─────────────────────────────────────────────────
        let logoCard = ObligeCard(background: .obligePaper, shadowColor: .obligePink)

        let logoLabel = UILabel()
        logoLabel.text = "OBLIGE"
        logoLabel.font = UIFont(name: "AvenirNext-Heavy", size: 52)
            ?? .systemFont(ofSize: 52, weight: .heavy)

        // 로고 텍스트를 두 색으로 분할 (OBLI=navy, GE=pink)
        let att = NSMutableAttributedString(string: "OBLI", attributes: [
            .foregroundColor: UIColor.obligeNavy,
            .font: UIFont.systemFont(ofSize: 52, weight: .heavy)
        ])
        att.append(NSAttributedString(string: "GE", attributes: [
            .foregroundColor: UIColor.obligePink,
            .font: UIFont.systemFont(ofSize: 52, weight: .heavy)
        ]))
        logoLabel.attributedText = att
        logoLabel.textAlignment = .center

        let tagLine = UILabel()
        tagLine.text = "순환형 비건 뷰티"
        tagLine.font = .systemFont(ofSize: 14, weight: .semibold)
        tagLine.textColor = UIColor.obligeInk.withAlphaComponent(0.5)
        tagLine.textAlignment = .center

        let logoStack = UIStackView(arrangedSubviews: [logoLabel, tagLine])
        logoStack.axis = .vertical; logoStack.spacing = 8
        logoStack.isLayoutMarginsRelativeArrangement = true
        logoStack.layoutMargins = UIEdgeInsets(top: 28, left: 24, bottom: 28, right: 24)
        logoStack.translatesAutoresizingMaskIntoConstraints = false
        logoCard.addSubview(logoStack)
        NSLayoutConstraint.activate([
            logoStack.topAnchor.constraint(equalTo: logoCard.topAnchor),
            logoStack.leadingAnchor.constraint(equalTo: logoCard.leadingAnchor),
            logoStack.trailingAnchor.constraint(equalTo: logoCard.trailingAnchor),
            logoStack.bottomAnchor.constraint(equalTo: logoCard.bottomAnchor),
        ])

        // ── Headline ──────────────────────────────────────────────────
        let headline = UILabel()
        headline.text = "Beauty that\ncomes back."
        headline.font = .systemFont(ofSize: 38, weight: .heavy)
        headline.textColor = .obligeWhite
        headline.numberOfLines = 2

        let subtext = UILabel()
        subtext.text = "비건 화장품 구매 · 공병 반납 · 포인트 적립"
        subtext.font = .systemFont(ofSize: 14)
        subtext.textColor = .obligeMint

        // ── CTA button ────────────────────────────────────────────────
        let startBtn = ObligePrimaryButton(title: "시작하기")
        // override shadow color to lime for splash
        ODS.applyHardShadow(startBtn, color: .obligeLime, offset: CGSize(width: 6, height: 6))
        startBtn.backgroundColor = .obligeLime
        startBtn.setTitleColor(.obligeInk, for: .normal)
        startBtn.addTarget(self, action: #selector(startTapped), for: .touchUpInside)

        let versionChip = ObligeChip(text: "v1.0.0", background: .obligePink)

        // ── Main stack ────────────────────────────────────────────────
        let mainStack = UIStackView(arrangedSubviews: [
            chipRow, logoCard, headline, subtext,
            UIView(), // flexible spacer
            startBtn, versionChip
        ])
        mainStack.axis = .vertical
        mainStack.spacing = 20
        mainStack.setCustomSpacing(16, after: chipRow)
        mainStack.setCustomSpacing(28, after: logoCard)
        mainStack.setCustomSpacing(8, after: headline)
        mainStack.setCustomSpacing(0, after: subtext)
        mainStack.setCustomSpacing(16, after: startBtn)
        mainStack.alignment = .fill
        mainStack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(mainStack)

        NSLayoutConstraint.activate([
            mainStack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 32),
            mainStack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 24),
            mainStack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -24),
            mainStack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -24),
            versionChip.widthAnchor.constraint(equalToConstant: 72),
            versionChip.centerXAnchor.constraint(equalTo: mainStack.centerXAnchor),
        ])
    }

    @objc private func startTapped() {
        // SceneDelegate에서 Auth 전환 처리
    }
}
