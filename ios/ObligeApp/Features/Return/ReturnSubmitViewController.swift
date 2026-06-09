import UIKit
import PhotosUI

class ReturnSubmitViewController: UIViewController {

    private let tableView = UITableView(frame: .zero, style: .insetGrouped)

    private let repo = BottleReturnRepository()
    private var bottleCount = 1
    private var bottleType = "일반 화장품 용기"
    private var returnMethod: BottleReturn.ReturnMethod = .delivery
    private var selectedImages: [UIImage] = []

    private let bottleTypes = ["일반 화장품 용기", "유리 용기", "펌프형 용기", "튜브형 용기"]

    private enum Row: Int, CaseIterable {
        case count, type, method, photos, point
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        title = "공병 반납"
        view.backgroundColor = .obligePaper
        tableView.backgroundColor = .obligePaper

        tableView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(tableView)
        NSLayoutConstraint.activate([
            tableView.topAnchor.constraint(equalTo: view.topAnchor),
            tableView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            tableView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            tableView.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])

        tableView.dataSource = self
        tableView.delegate = self
        tableView.register(UITableViewCell.self, forCellReuseIdentifier: "Cell")

        navigationItem.leftBarButtonItem = UIBarButtonItem(
            title: "취소", style: .plain, target: self, action: #selector(cancelTapped)
        )
        navigationItem.rightBarButtonItem = UIBarButtonItem(
            title: "신청", style: .done, target: self, action: #selector(submitTapped)
        )
        navigationItem.rightBarButtonItem?.tintColor = .obligePink
    }

    @objc private func cancelTapped() { dismiss(animated: true) }

    @objc private func submitTapped() {
        guard let userId = ProfileStore.shared.profile?.id else { return }
        navigationItem.rightBarButtonItem?.isEnabled = false

        Task {
            do {
                _ = try await repo.submitReturn(
                    userId: userId, bottleCount: bottleCount,
                    bottleType: bottleType, returnMethod: returnMethod,
                    images: selectedImages
                )
                await MainActor.run {
                    self.showToast("반납 신청이 완료되었습니다 ♻️")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                        self.dismiss(animated: true)
                    }
                }
            } catch {
                await MainActor.run {
                    self.showToast(error.localizedDescription)
                    self.navigationItem.rightBarButtonItem?.isEnabled = true
                }
            }
        }
    }

    private func openPhotoPicker() {
        var config = PHPickerConfiguration()
        config.selectionLimit = 5
        config.filter = .images
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = self
        present(picker, animated: true)
    }
}

// MARK: - TableView

extension ReturnSubmitViewController: UITableViewDataSource, UITableViewDelegate {

    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int { Row.allCases.count }

    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let cell = tableView.dequeueReusableCell(withIdentifier: "Cell", for: indexPath)
        var config = cell.defaultContentConfiguration()

        switch Row(rawValue: indexPath.row)! {
        case .count:
            config.text = "공병 수량"
            cell.accessoryView = makeStepperView()
            cell.selectionStyle = .none

        case .type:
            config.text = "용기 종류"
            config.secondaryText = bottleType
            cell.accessoryType = .disclosureIndicator

        case .method:
            config.text = "반납 방법"
            config.secondaryText = returnMethod.label
            cell.accessoryType = .disclosureIndicator

        case .photos:
            config.text = selectedImages.isEmpty
                ? "사진 첨부 (최대 5장)"
                : "사진 \(selectedImages.count)장 선택됨"
            config.image = UIImage(systemName: "camera.fill")
            config.imageProperties.tintColor = .obligeGreen
            cell.accessoryType = .disclosureIndicator

        case .point:
            let estimated = bottleCount * 500
            config.text = "예상 적립 포인트"
            config.secondaryText = "+\(estimated)P (검수 후 확정)"
            config.secondaryTextProperties.color = .obligePink
            config.secondaryTextProperties.font = .systemFont(ofSize: 16, weight: .bold)
            cell.selectionStyle = .none
            cell.backgroundColor = .obligeMint
        }

        cell.contentConfiguration = config
        return cell
    }

    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        tableView.deselectRow(at: indexPath, animated: true)
        switch Row(rawValue: indexPath.row)! {
        case .type:
            showActionSheet(title: "용기 종류", options: bottleTypes) { [weak self] selected in
                self?.bottleType = selected
                tableView.reloadRows(at: [indexPath], with: .automatic)
            }
        case .method:
            let options = BottleReturn.ReturnMethod.allCases.map { $0.label }
            showActionSheet(title: "반납 방법", options: options) { [weak self] selected in
                self?.returnMethod = BottleReturn.ReturnMethod.allCases.first { $0.label == selected } ?? .delivery
                tableView.reloadRows(at: [indexPath], with: .automatic)
            }
        case .photos:
            openPhotoPicker()
        default: break
        }
    }

    private func makeStepperView() -> UIView {
        let stepper = UIStepper()
        stepper.minimumValue = 1; stepper.maximumValue = 20; stepper.value = Double(bottleCount)
        stepper.addTarget(self, action: #selector(stepperChanged(_:)), for: .valueChanged)

        let label = UILabel()
        label.text = "\(bottleCount)개"
        label.font = .systemFont(ofSize: 16, weight: .medium)
        label.textAlignment = .right
        label.frame = CGRect(x: 0, y: 0, width: 36, height: 32)

        let stack = UIStackView(arrangedSubviews: [label, stepper])
        stack.axis = .horizontal; stack.spacing = 8; stack.alignment = .center
        stack.frame = CGRect(x: 0, y: 0, width: 160, height: 44)
        stepper.accessibilityLabel = "bottleStepper"

        // tag로 label 참조
        label.tag = 999
        stack.tag = 888
        return stack
    }

    @objc private func stepperChanged(_ sender: UIStepper) {
        bottleCount = Int(sender.value)
        if let stack = sender.superview as? UIStackView,
           let label = stack.viewWithTag(999) as? UILabel {
            label.text = "\(bottleCount)개"
        }
        tableView.reloadRows(at: [IndexPath(row: Row.point.rawValue, section: 0)], with: .none)
    }

    private func showActionSheet(title: String, options: [String], completion: @escaping (String) -> Void) {
        let alert = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        options.forEach { option in
            alert.addAction(UIAlertAction(title: option, style: .default) { _ in completion(option) })
        }
        alert.addAction(UIAlertAction(title: "취소", style: .cancel))
        present(alert, animated: true)
    }
}

// MARK: - PHPickerViewControllerDelegate

extension ReturnSubmitViewController: PHPickerViewControllerDelegate {
    func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
        dismiss(animated: true)
        selectedImages = []
        let group = DispatchGroup()
        for result in results {
            group.enter()
            result.itemProvider.loadObject(ofClass: UIImage.self) { [weak self] object, _ in
                if let image = object as? UIImage { self?.selectedImages.append(image) }
                group.leave()
            }
        }
        group.notify(queue: .main) { [weak self] in
            self?.tableView.reloadRows(at: [IndexPath(row: Row.photos.rawValue, section: 0)], with: .automatic)
        }
    }
}
