import UIKit

class HomeViewController: UIViewController {

    private let scroll = UIScrollView()
    private let productRepo = ProductRepository()
    private var products: [Product] = []

    // product collection
    private let collectionView: UICollectionView = {
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .horizontal
        layout.itemSize = CGSize(width: 140, height: 200)
        layout.sectionInset = UIEdgeInsets(top: 0, left: 16, bottom: 0, right: 16)
        layout.minimumLineSpacing = 12
        return UICollectionView(frame: .zero, collectionViewLayout: layout)
    }()

    // grade info refs
    private let gradeNumLabel   = UILabel()
    private let gradeNameLabel  = UILabel()
    private let pointValueLabel = UILabel()
    private let progressBar     = UIView()
    private let progressFill    = UIView()
    private let nextGradeLabel  = UILabel()

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .obligePaper
        setupNav()
        setupLayout()
        collectionView.dataSource = self
        collectionView.delegate   = self
        collectionView.register(ProductCell.self, forCellWithReuseIdentifier: ProductCell.reuseID)
        collectionView.backgroundColor = .clear
        collectionView.showsHorizontalScrollIndicator = false
    }

    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        updateGradeUI()
        Task { await loadProducts() }
    }

    // MARK: - Nav

    private func setupNav() {
        let logo = UILabel()
        let att = NSMutableAttributedString(string: "OBLI", attributes: [
            .foregroundColor: UIColor.obligeNavy,
            .font: UIFont.systemFont(ofSize: 20, weight: .heavy)
        ])
        att.append(NSAttributedString(string: "GE", attributes: [
            .foregroundColor: UIColor.obligePink,
            .font: UIFont.systemFont(ofSize: 20, weight: .heavy)
        ]))
        logo.attributedText = att
        navigationItem.titleView = logo

        navigationItem.rightBarButtonItem = UIBarButtonItem(
            image: UIImage(systemName: "bag"),
            style: .plain, target: self, action: #selector(cartTapped)
        )
    }

    @objc private func cartTapped() {
        let vc = CartViewController()
        navigationController?.pushViewController(vc, animated: true)
    }

    // MARK: - Layout

    private func setupLayout() {
        scroll.translatesAutoresizingMaskIntoConstraints = false
        scroll.showsVerticalScrollIndicator = false
        view.addSubview(scroll)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            scroll.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            scroll.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            scroll.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])

        let main = UIStackView(arrangedSubviews: [
            makeHeroBanner(),
            makeStatsStrip(),
            makeSectionHeader(title: "추천 제품", action: "전체보기 →"),
            makeProductRow(),
            makeSectionHeader(title: "공병 반납 3단계", action: nil),
            makeFlowCards(),
            makeGradeCard(),
        ])
        main.axis = .vertical
        main.spacing = 20
        main.setCustomSpacing(12, after: makeSectionHeader(title: "", action: nil))
        main.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(main)
        NSLayoutConstraint.activate([
            main.topAnchor.constraint(equalTo: scroll.topAnchor, constant: 16),
            main.leadingAnchor.constraint(equalTo: scroll.leadingAnchor, constant: 16),
            main.trailingAnchor.constraint(equalTo: scroll.trailingAnchor, constant: -16),
            main.bottomAnchor.constraint(equalTo: scroll.bottomAnchor, constant: -24),
            main.widthAnchor.constraint(equalTo: scroll.widthAnchor, constant: -32),
        ])
    }

    // ── Hero banner ───────────────────────────────────────────────────
    private func makeHeroBanner() -> UIView {
        let card = UIView()
        card.backgroundColor = .obligeInk
        card.layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(card, color: .obligeInk)
        ODS.applyHardShadow(card, color: .obligePink, offset: CGSize(width: 8, height: 8))

        let chip = ObligeChip(text: "NEW REFILL DROP", background: .obligeLime)

        let headline = UILabel()
        headline.text = "Beauty that\ncomes back."
        headline.font = .systemFont(ofSize: 28, weight: .heavy)
        headline.textColor = .obligeWhite
        headline.numberOfLines = 2

        let ctaBtn = ObligeSecondaryButton(title: "오늘 반납 시작")
        ctaBtn.widthAnchor.constraint(equalToConstant: 140).isActive = true

        // Bottle visual (simplified)
        let bottleView = UIView()
        bottleView.backgroundColor = .obligeLime
        bottleView.layer.cornerRadius = 20
        ODS.applyBorder(bottleView, color: .obligeInk)
        ODS.applyHardShadow(bottleView, color: .obligeInk, offset: CGSize(width: 4, height: 4))
        let bottleLbl = UILabel()
        bottleLbl.text = "OBLIGE\nREFILL"
        bottleLbl.font = .systemFont(ofSize: 11, weight: .heavy)
        bottleLbl.textColor = .obligeInk
        bottleLbl.textAlignment = .center
        bottleLbl.numberOfLines = 2
        bottleLbl.translatesAutoresizingMaskIntoConstraints = false
        bottleView.addSubview(bottleLbl)
        NSLayoutConstraint.activate([
            bottleLbl.centerXAnchor.constraint(equalTo: bottleView.centerXAnchor),
            bottleLbl.centerYAnchor.constraint(equalTo: bottleView.centerYAnchor),
            bottleView.widthAnchor.constraint(equalToConstant: 72),
            bottleView.heightAnchor.constraint(equalToConstant: 120),
        ])

        let leftStack = UIStackView(arrangedSubviews: [chip, headline, ctaBtn])
        leftStack.axis = .vertical; leftStack.spacing = 14; leftStack.alignment = .leading

        let row = UIStackView(arrangedSubviews: [leftStack, bottleView])
        row.axis = .horizontal; row.spacing = 12; row.alignment = .center
        row.isLayoutMarginsRelativeArrangement = true
        row.layoutMargins = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 16)
        row.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(row)
        NSLayoutConstraint.activate([
            row.topAnchor.constraint(equalTo: card.topAnchor),
            row.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            row.trailingAnchor.constraint(equalTo: card.trailingAnchor),
            row.bottomAnchor.constraint(equalTo: card.bottomAnchor),
        ])
        return card
    }

    // ── Stats strip ───────────────────────────────────────────────────
    private func makeStatsStrip() -> UIStackView {
        let stats: [(String, String, UIColor)] = [
            ("12.4K", "누적 공병 회수", .obligeMint),
            ("98%",   "파트너 재활용률", .obligeSky),
            ("2.4t",  "플라스틱 절감",  .obligeClay),
        ]
        let stack = UIStackView(arrangedSubviews: stats.map { makeStatCard($0.0, $0.1, $0.2) })
        stack.axis = .horizontal; stack.spacing = 10; stack.distribution = .fillEqually
        return stack
    }

    private func makeStatCard(_ value: String, _ label: String, _ bg: UIColor) -> UIView {
        let card = UIView()
        card.backgroundColor = bg
        card.layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(card, color: .obligeInk)
        ODS.applyHardShadow(card, color: .obligeInk, offset: CGSize(width: 4, height: 4))

        let vLabel = UILabel()
        vLabel.text = value; vLabel.font = .systemFont(ofSize: 22, weight: .heavy); vLabel.textColor = .obligeInk
        let lLabel = UILabel()
        lLabel.text = label; lLabel.font = .systemFont(ofSize: 10, weight: .bold)
        lLabel.textColor = UIColor.obligeInk.withAlphaComponent(0.6); lLabel.numberOfLines = 2

        let stack = UIStackView(arrangedSubviews: [vLabel, lLabel])
        stack.axis = .vertical; stack.spacing = 6
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 12, left: 12, bottom: 12, right: 12)
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor),
            card.heightAnchor.constraint(equalToConstant: 80),
        ])
        return card
    }

    // ── Section header ────────────────────────────────────────────────
    private func makeSectionHeader(title: String, action: String?) -> UIView {
        guard !title.isEmpty else { return UIView() }
        let titleLbl = UILabel()
        titleLbl.text = title; titleLbl.font = .systemFont(ofSize: 18, weight: .bold); titleLbl.textColor = .obligeInk

        let row = UIStackView(arrangedSubviews: [titleLbl])
        if let action = action {
            let btn = UIButton(type: .system)
            btn.setTitle(action, for: .normal)
            btn.titleLabel?.font = .systemFont(ofSize: 13, weight: .bold)
            btn.setTitleColor(.obligePink, for: .normal)
            row.addArrangedSubview(btn)
        }
        row.axis = .horizontal; row.alignment = .center; row.distribution = .equalSpacing
        return row
    }

    // ── Product collection row ─────────────────────────────────────────
    private func makeProductRow() -> UIView {
        collectionView.translatesAutoresizingMaskIntoConstraints = false
        collectionView.heightAnchor.constraint(equalToConstant: 210).isActive = true
        return collectionView
    }

    // ── Flow cards (3단계) ────────────────────────────────────────────
    private func makeFlowCards() -> UIStackView {
        let flows: [(String, String, String, UIColor)] = [
            ("01", "🛍", "구매",   .obligeWhite),
            ("02", "📷", "반납",   .obligeMint),
            ("03", "↺",  "적립",  UIColor(hex: "#ffd5ea")),
        ]
        let stack = UIStackView(arrangedSubviews: flows.map { makeFlowCard($0.0, $0.1, $0.2, $0.3) })
        stack.axis = .horizontal; stack.spacing = 10; stack.distribution = .fillEqually
        return stack
    }

    private func makeFlowCard(_ num: String, _ icon: String, _ label: String, _ bg: UIColor) -> UIView {
        let card = UIView()
        card.backgroundColor = bg
        card.layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(card, color: .obligeInk)
        ODS.applyHardShadow(card, color: .obligeInk, offset: CGSize(width: 4, height: 4))

        let numLbl = UILabel(); numLbl.text = num; numLbl.font = .systemFont(ofSize: 22, weight: .heavy); numLbl.textColor = .obligeInk
        let icoLbl = UILabel(); icoLbl.text = icon; icoLbl.font = .systemFont(ofSize: 20)
        let topRow = UIStackView(arrangedSubviews: [numLbl, icoLbl]); topRow.axis = .horizontal; topRow.distribution = .equalSpacing; topRow.alignment = .center
        let lbl = UILabel(); lbl.text = label; lbl.font = .systemFont(ofSize: 14, weight: .bold); lbl.textColor = .obligeInk

        let stack = UIStackView(arrangedSubviews: [topRow, lbl])
        stack.axis = .vertical; stack.spacing = 14
        stack.isLayoutMarginsRelativeArrangement = true
        stack.layoutMargins = UIEdgeInsets(top: 14, left: 12, bottom: 14, right: 12)
        stack.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: card.topAnchor),
            stack.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            stack.trailingAnchor.constraint(equalTo: card.trailingAnchor),
            stack.bottomAnchor.constraint(equalTo: card.bottomAnchor),
            card.heightAnchor.constraint(equalToConstant: 90),
        ])
        return card
    }

    // ── Grade progress card ───────────────────────────────────────────
    private func makeGradeCard() -> UIView {
        let card = UIView()
        card.backgroundColor = .obligeInk
        card.layer.cornerRadius = ODS.radiusCard
        ODS.applyBorder(card, color: .obligePink)
        ODS.applyHardShadow(card, color: .obligePink, offset: CGSize(width: 7, height: 7))

        gradeNumLabel.font  = .systemFont(ofSize: 44, weight: .heavy)
        gradeNumLabel.textColor = UIColor(hex: "#ffd5ea")
        gradeNameLabel.font = .systemFont(ofSize: 24, weight: .bold)
        gradeNameLabel.textColor = .obligeLime
        pointValueLabel.font = .systemFont(ofSize: 20, weight: .bold)
        pointValueLabel.textColor = .obligeLime
        pointValueLabel.textAlignment = .right
        nextGradeLabel.font = .systemFont(ofSize: 12)
        nextGradeLabel.textColor = .obligeMint

        // progress bar track
        progressBar.backgroundColor = UIColor.obligeWhite.withAlphaComponent(0.2)
        progressBar.layer.cornerRadius = 3
        progressFill.backgroundColor = .obligeLime
        progressFill.layer.cornerRadius = 3
        progressBar.addSubview(progressFill)

        let leftStack = UIStackView(arrangedSubviews: [gradeNumLabel, gradeNameLabel])
        leftStack.axis = .vertical; leftStack.spacing = 0

        let rightStack = UIStackView(arrangedSubviews: [pointValueLabel, nextGradeLabel, progressBar])
        rightStack.axis = .vertical; rightStack.spacing = 8; rightStack.alignment = .trailing

        let row = UIStackView(arrangedSubviews: [leftStack, rightStack])
        row.axis = .horizontal; row.alignment = .center; row.spacing = 12
        row.isLayoutMarginsRelativeArrangement = true
        row.layoutMargins = UIEdgeInsets(top: 20, left: 20, bottom: 20, right: 20)
        row.translatesAutoresizingMaskIntoConstraints = false
        card.addSubview(row)

        progressBar.translatesAutoresizingMaskIntoConstraints = false
        progressFill.translatesAutoresizingMaskIntoConstraints = false

        NSLayoutConstraint.activate([
            row.topAnchor.constraint(equalTo: card.topAnchor),
            row.leadingAnchor.constraint(equalTo: card.leadingAnchor),
            row.trailingAnchor.constraint(equalTo: card.trailingAnchor),
            row.bottomAnchor.constraint(equalTo: card.bottomAnchor),
            progressBar.heightAnchor.constraint(equalToConstant: 6),
            progressBar.widthAnchor.constraint(equalToConstant: 140),
            progressFill.topAnchor.constraint(equalTo: progressBar.topAnchor),
            progressFill.leadingAnchor.constraint(equalTo: progressBar.leadingAnchor),
            progressFill.bottomAnchor.constraint(equalTo: progressBar.bottomAnchor),
        ])
        return card
    }

    // MARK: - Data

    private func updateGradeUI() {
        guard let profile = ProfileStore.shared.profile else { return }
        let current = GradeRule.current(for: profile)
        let next    = GradeRule.next(for: profile)

        let index = GradeRule.all.firstIndex(where: { $0.grade == current.grade }) ?? 0
        gradeNumLabel.text  = String(format: "%02d", index + 1)
        gradeNameLabel.text = current.grade.uppercased()

        let f = NumberFormatter(); f.numberStyle = .decimal
        pointValueLabel.text = (f.string(from: NSNumber(value: profile.point)) ?? "\(profile.point)") + "P"

        if let next = next {
            let range = CGFloat(next.minReturnCount - current.minReturnCount)
            let done  = CGFloat(profile.bottleReturnCount - current.minReturnCount)
            let ratio = max(0, min(1, done / range))
            nextGradeLabel.text = "\(next.grade)까지 \(next.minReturnCount - profile.bottleReturnCount)개"
            progressFill.widthAnchor.constraint(equalToConstant: 140 * ratio).isActive = true
        } else {
            nextGradeLabel.text = "최고 등급 달성! 🎉"
            progressFill.widthAnchor.constraint(equalToConstant: 140).isActive = true
        }
    }

    private func loadProducts() async {
        products = (try? await productRepo.fetchProducts()) ?? []
        await MainActor.run { collectionView.reloadData() }
    }
}

// MARK: - CollectionView

extension HomeViewController: UICollectionViewDataSource, UICollectionViewDelegate {
    func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int { min(products.count, 6) }
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
