from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

API_KEY = "c2afae7bc91449aaa837aa5452c9a089"

@app.route('/api/recognize-food', methods=['POST'])
def recognize_food():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    url = "https://api.spoonacular.com/food/images/analyze"
    files = {'file': file}

    try:
        response = requests.post(url, files=files, params={"apiKey": API_KEY})
        
        if response.status_code == 200:
            spoonacular_data = response.json()

            # Extract the relevant data: food category and calories
            food_category = spoonacular_data.get("category", "Unknown food")
            calories = spoonacular_data.get("nutrition", {}).get("calories", "Unknown calories")
            
            # Return only the necessary data
            return jsonify({
                "category": food_category,
                "calories": calories
            })
        else:
            return jsonify({"error": "Spoonacular model prediction failed", "details": response.text}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to call Spoonacular API: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
