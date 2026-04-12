$dir = "c:\Users\91933\Downloads\website\frontend\public\models"
$base = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Clean existing files
Remove-Item "$dir\*" -Force -ErrorAction SilentlyContinue

$files = @(
  "tiny_face_detector_model-shard1",
  "tiny_face_detector_model-weights_manifest.json",
  "face_landmark_68_model-shard1",
  "face_landmark_68_model-weights_manifest.json",
  "face_recognition_model-shard1",
  "face_recognition_model-shard2",
  "face_recognition_model-weights_manifest.json"
)

foreach ($f in $files) {
  Write-Host "Downloading $f..."
  Invoke-WebRequest -Uri "$base/$f" -OutFile "$dir\$f"
  $sz = (Get-Item "$dir\$f").Length
  Write-Host "  Downloaded: $sz bytes"
}

Write-Host "All model files downloaded!"
