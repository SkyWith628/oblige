// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ObligeApp",
    platforms: [.iOS(.v16)],
    dependencies: [
        .package(url: "https://github.com/supabase/supabase-swift.git", from: "2.5.0"),
    ],
    targets: [
        .executableTarget(
            name: "ObligeApp",
            dependencies: [
                .product(name: "Supabase", package: "supabase-swift"),
            ],
            path: "ObligeApp"
        ),
    ]
)
