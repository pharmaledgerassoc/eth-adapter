import base64
import os
import sys

import requests
import json
import time

# Configuration
source_url = "http://localhost:8080"  # Assuming you've port-forwarded to 8080
destination_url = "http://localhost:8080"  # Replace it with actual destination URL


def get_total_anchors():
    response = requests.get(f"{source_url}/totalNumberOfAnchors")
    if response.status_code == 200:
        total = response.json()
        print(f"Total number of anchors: {total}")
        return total
    else:
        raise Exception(f"Failed to get total number of anchors: {response.status_code}")


def dump_anchors(total_anchors, chunk_size=50, max_size=10000000):
    all_anchors = []
    for start in range(0, total_anchors, chunk_size):
        end = min(start + chunk_size, total_anchors)
        print(f"Fetching anchors {start} to {end}")
        response = requests.get(f"{source_url}/dumpAnchors?from={start}&limit={chunk_size}&maxSize={max_size}")
        if response.status_code == 200:
            chunk = response.json()
            all_anchors.extend(chunk)
        else:
            print(f"Failed to fetch anchors {start} to {end}: {response.status_code}")
        time.sleep(0.1)  # Add a small delay to avoid overwhelming the API
    return all_anchors


def save_to_json(data, filename="anchors_dump.json"):
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"Anchors saved to {filename}")


def save_to_filesystem(anchors, base_folder="anchors"):
    """
    Save anchors to individual files in the specified folder.
    Each anchor ID is base64 encoded for the filename, and each value is written on a separate line.
    Returns tuple (success_count, error_count, error_messages)
    """
    # Create the base folder if it doesn't exist
    try:
        os.makedirs(base_folder, exist_ok=True)
    except Exception as e:
        print(f"Failed to create directory {base_folder}: {str(e)}")
        return 0, 0, []

    total_saved = 0
    total_errors = 0
    error_messages = []
    anchor_id = 0

    for anchor in anchors:
        anchor_id = anchor['anchorId']
        safe_filename = base64.urlsafe_b64encode(anchor_id.encode('utf-8')).decode('utf-8').rstrip('=')
        file_path = os.path.join(base_folder, safe_filename)

        try:
            with open(file_path, 'w') as f:
                for value in anchor['anchorValues']:
                    f.write(json.dumps(value)[1:-1] + "\n")
            total_saved += 1
        except Exception as e:
            total_errors += 1
            error_messages.append(f"Error saving anchor {anchor_id}: {str(e)}")

    return total_saved, total_errors, error_messages


def get_valid_filename(check_exists=False):
    while True:
        filename = input("Enter the JSON file name without extension (default: anchors_dump): ") or "anchors_dump.json"

        # Remove any leading/trailing whitespace and quotes
        filename = filename.strip().strip("'\"")

        # Check if the filename already has a .json extension
        if filename.lower().endswith('.json'):
            base_name = os.path.splitext(filename)[0]
        else:
            base_name = filename

        # Append .json extension if not present
        full_filename = f"{base_name}.json"

        # Validate that the file has a .json extension
        if not full_filename.lower().endswith('.json'):
            print("Error: File must have a .json extension.")
            continue

        # Check if the file exists when check_exists is True
        if check_exists and not os.path.exists(full_filename):
            print(f"Error: File '{full_filename}' does not exist.")
            sys.exit(1)

        return full_filename


def read_from_json(filename="anchors_dump.json"):
    try:
        with open(filename, 'r') as f:
            data = json.load(f)
        print(f"Successfully read {len(data)} anchors from {filename}")
        return data
    except FileNotFoundError:
        print(f"File {filename} not found.")
        return None
    except json.JSONDecodeError:
        print(f"Error decoding JSON from {filename}.")
        return None


def create_or_append_multiple_anchors(anchors, chunk_size=1):
    all_formatted_anchors = []

    # First, create a flat list of all anchors with their individual values
    for anchor in anchors:
        anchor_id = anchor['anchorId']
        for anchor_value in anchor['anchorValues']:
            all_formatted_anchors.append({
                'anchorId': anchor_id,
                'anchorValue': anchor_value
            })

    # Now process the flat list in chunks
    for start in range(0, len(all_formatted_anchors), chunk_size):
        end = min(start + chunk_size, len(all_formatted_anchors))
        chunk = all_formatted_anchors[start:end]

        print(f"formatted_chunk {chunk}")
        print(f"Uploading anchors {start} to {end}")

        # Start the timer
        start_time = time.time()

        response = requests.put(
            f"{destination_url}/createOrAppendMultipleAnchors",
            json=chunk
        )

        # Calculate the elapsed time
        elapsed_time = time.time() - start_time

        if response.status_code == 200:
            print(f"Successfully uploaded anchors {start} to {end}. Response time: {elapsed_time:.2f} seconds")
        else:
            print(
                f"Failed to upload anchors {start} to {end}: {response.status_code}. Response time: {elapsed_time:.2f} seconds")
            print(f"Response content: {response.text}")

        time.sleep(3)  # Add a small delay to avoid overwhelming the API


def handle_export(filename):
    global source_url
    source_url = input("Enter source blockchain URL (default: http://localhost:8080): ") or "http://localhost:8080"

    total_anchors = get_total_anchors()
    print("Dumping anchors...")
    anchors = dump_anchors(total_anchors)
    save_to_json(anchors, filename)
    print(f"Export complete. Anchors saved to {filename}")
    return anchors


def handle_import(filename, anchors=None):
    if anchors is None:
        anchors = read_from_json(filename)
        if not anchors:
            print("Failed to read anchors from file. Exiting.")
            return None

    print(f"Total anchors to import: {len(anchors)}")

    while True:
        storage_type = input("Choose storage type (1: Blockchain, 2: FileSystem): ").strip()
        if storage_type in ['1', '2']:
            break
        print("Invalid choice. Please enter 1 or 2.")

    if storage_type == '1':
        global destination_url
        destination_url = input(
            "Enter destination blockchain URL (default: http://localhost:8080): ") or "http://localhost:8080"
        print("Uploading anchors to blockchain...")
        create_or_append_multiple_anchors(anchors)
        print("Import to blockchain complete!")
    else:
        folder_name = "anchors"
        print(f"Saving anchors to filesystem in folder '{folder_name}'...")

        success_count, error_count, error_messages = save_to_filesystem(anchors, folder_name)

        # Report results
        if error_count > 0:
            print("\nEncountered errors while saving:")
            for error in error_messages:
                print(error)

            if success_count > 0:
                print(
                    f"\nPartially completed: Successfully saved {success_count} anchors, failed to save {error_count} anchors.")
            else:
                print("\nFailed: No anchors were saved successfully.")
        else:
            print(f"\nSuccess: All {success_count} anchors were saved successfully!")


def migrate_anchors():
    while True:
        print("\nChoose operation:")
        print("0. Exit")
        print("1. Export from blockchain")
        print("2. Import to blockchain")
        print("3. Both export and import")
        choice = input("Enter your choice (0/1/2/3): ")

        if choice == '0':
            print("Exiting the program.")
            return
        elif choice in ['1', '2', '3']:
            break
        else:
            print("Invalid choice. Please enter 0, 1, 2, or 3.")

    filename = get_valid_filename(check_exists=(choice == '2'))

    # Handle operations based on choice
    anchors = None
    if choice in ['1', '3']:
        anchors = handle_export(filename)

    if choice in ['2', '3']:
        handle_import(filename, anchors)


if __name__ == "__main__":
    migrate_anchors()
