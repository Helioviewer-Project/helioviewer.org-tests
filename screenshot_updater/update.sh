#!/bin/bash
set -x

# Default values
HOST="127.0.0.1"
PORT="9876"

# Parse command line arguments
while getopts "h:p:" opt; do
    case $opt in
        h) HOST="$OPTARG";;
        p) PORT="$OPTARG";;
        \?) echo "Invalid option -$OPTARG" >&2; exit 1;;
    esac
done

# Shift past the options to get the positional argument
shift $((OPTIND-1))

if [ $# -ne 1 ]; then
    echo "Usage: $0 [-h host] [-p port] <playwright_report_zip_file_or_github_url>"
    echo "  -h host    Host to bind the HTTP server (default: 127.0.0.1)"
    echo "  -p port    Port to bind the HTTP server (default: 9876)"
    echo ""
    echo "Arguments:"
    echo "  <playwright_report_zip_file_or_github_url>  Local zip file or GitHub artifact URL"
    exit 1
fi

wd="$PWD"
input="$1"

# Check if input is a GitHub URL
if [[ "$input" =~ ^https://github\.com/([^/]+)/([^/]+)/actions/runs/([0-9]+)/artifacts/([0-9]+) ]]; then
    # Extract parts from URL
    owner="${BASH_REMATCH[1]}"
    repo="${BASH_REMATCH[2]}"
    run_id="${BASH_REMATCH[3]}"
    artifact_id="${BASH_REMATCH[4]}"

    # Check if gh is available
    if ! command -v gh &> /dev/null; then
        echo "Error: GitHub CLI (gh) is not installed or not in PATH."
        echo "To download artifacts from GitHub, please install gh:"
        echo "  https://cli.github.com/"
        exit 1
    fi

    echo "Downloading artifact $artifact_id from $owner/$repo (run: $run_id)..."

    # Download the artifact using gh CLI
    # gh run download will download to current directory
    if ! gh run download "$run_id" --repo "$owner/$repo" -n "$(gh api repos/$owner/$repo/actions/artifacts/$artifact_id --jq '.name')" 2>/dev/null; then
        # If name-based download fails, try downloading all artifacts and find the right one
        echo "Attempting to download artifact using artifact ID..."
        temp_artifact_dir=$(mktemp -d)
        if gh api repos/$owner/$repo/actions/artifacts/$artifact_id/zip > "$temp_artifact_dir/artifact.zip" 2>/dev/null; then
            zip_file="$temp_artifact_dir/artifact.zip"
        else
            echo "Error: Failed to download artifact. Make sure you're authenticated with 'gh auth login'"
            rm -rf "$temp_artifact_dir"
            exit 1
        fi
    else
        # Find the downloaded zip file (gh downloads artifacts as zip files with the artifact name)
        zip_file=$(find . -maxdepth 1 -name "*.zip" -type f -newer "$wd" | head -1)
        if [ -z "$zip_file" ]; then
            echo "Error: Could not find downloaded artifact zip file"
            exit 1
        fi
    fi

    echo "Artifact downloaded successfully: $zip_file"
else
    # Input is a local file
    zip_file="$input"
    if [ ! -f "$zip_file" ]; then
        echo "Error: File not found: $zip_file"
        exit 1
    fi
fi

temp_dir=$(mktemp -d)
unzip $zip_file -d "$temp_dir"
cd $temp_dir
cp -r data "$wd"

# Extract base64 string from index.html
# Save the base64 string to a file
grep -oE 'window\.playwrightReportBase64 = "data:application/zip;base64,[^"]*' "$temp_dir/index.html" | awk -F'base64,' '{print $2}' > playwright_report_base64
cat playwright_report_base64

# Decode the base64 string into a zip file
base64 -d -i playwright_report_base64 > decoded_playwright_report.zip

# Unzip the decoded zip file
unzip decoded_playwright_report.zip -d unzipped_report

# Extract unexpected test outcomes from report.json and format as a valid JSON array
unexpected_tests=$(jq -c '[.files[].tests[] | select(.outcome == "unexpected")]' unzipped_report/report.json)

echo $unexpected_tests > "$wd/failed_tests.json"

cd "$wd"
python3 -m http.server --cgi -b "$HOST" "$PORT"

# Clean up
# rm -rf "$temp_dir"

