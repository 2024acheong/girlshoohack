from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Spoonacular API key

API_KEY = "c2afae7bc91449aaa837aa5452c9a089"
@app.route('/api/recognize-food', methods=['POST'])
def recognize_food():
    # Check if an image file was uploaded
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    # Send the image to Spoonacular's food recognition API
    url = "https://api.spoonacular.com/food/images/analyze"
    files = {'file': file}
    
    try:
        response = requests.post(url, files=files, params={"apiKey": API_KEY})
        
        # Check if the response from Spoonacular is successful
        if response.status_code == 200:
            return jsonify(response.json())  # Return the API's JSON response
        else:
            # Return an error message if Spoonacular prediction failed
            return jsonify({"error": "Spoonacular model prediction failed", 
                            "details": response.text}), 500
    except Exception as e:
        # Return a general error message if the API call itself failed
        return jsonify({"error": f"Failed to call Spoonacular API: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
