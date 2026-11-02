import json

r2_map = json.load(open('docs/extracted/r2_image_map.json', 'r', encoding='utf-8'))
v3_path = 'docs/extracted/v3_final_questions.json'
data = json.load(open(v3_path, 'r', encoding='utf-8'))

R2_BASE = "https://pub-68568854a58845bc975b176de76b1ad5.r2.dev/question-images/dsssb-computer"

normalized_count = 0
for q in data:
    images = q.get('images', [])
    new_images = []
    for img in images:
        if img.startswith('http'):
            new_images.append(img)
        else:
            # Look up in map or construct URL
            url = r2_map.get(img, f"{R2_BASE}/{img}")
            new_images.append(url)
            normalized_count += 1
    q['images'] = new_images
    if new_images:
        q['questionImageUrl'] = new_images[0]
    else:
        q['questionImageUrl'] = None

with open(v3_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print(f"Normalized {normalized_count} image URLs. Total questions with questionImageUrl: {sum(1 for q in data if q.get('questionImageUrl'))}")

