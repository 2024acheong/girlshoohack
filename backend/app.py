from flask import Flask, request, jsonify
from clarifai_grpc.channel.clarifai_channel import ClarifaiChannel
from clarifai_grpc.grpc.api import resources_pb2, service_pb2, service_pb2_grpc
from clarifai_grpc.grpc.api.status import status_code_pb2
import requests
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Clarifai API details
PAT = '56c61bace6e74d1ebff4c204f1fca3ef'
USER_ID = 'kelvinbn'
APP_ID = 'my-first-application-vqhx5'
MODEL_ID = 'food-item-recognition'
MODEL_VERSION_ID = '1d5fd481e0cf4826aa72ec3ff049e044'

# FoodData Central API key
FDC_API_KEY = "33LTDogbfjVNvIgPSSJ6SjGbD9tf04ZSbFZkUqw8"

# Set up Clarifai gRPC client
channel = ClarifaiChannel.get_grpc_channel()
stub = service_pb2_grpc.V2Stub(channel)
metadata = (('authorization', 'Key ' + PAT),)

@app.route('/api/recognize-food', methods=['POST'])
def recognize_food():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    image_bytes = file.read()

    # Clarifai API call to recognize food
    post_model_outputs_response = stub.PostModelOutputs(
        service_pb2.PostModelOutputsRequest(
            user_app_id=resources_pb2.UserAppIDSet(user_id=USER_ID, app_id=APP_ID),
            model_id=MODEL_ID,
            version_id=MODEL_VERSION_ID,
            inputs=[
                resources_pb2.Input(
                    data=resources_pb2.Data(
                        image=resources_pb2.Image(
                            base64=image_bytes
                        )
                    )
                )
            ]
        ),
        metadata=metadata
    )

    if post_model_outputs_response.status.code != status_code_pb2.SUCCESS:
        return jsonify({"error": post_model_outputs_response.status.description}), 500

    # Extract the recognized food name
    output = post_model_outputs_response.outputs[0]
    recognized_food = output.data.concepts[0].name  # Get the most probable food item

    # Call FoodData Central API to get nutritional data
    try:
        response = requests.get(
            "https://api.nal.usda.gov/fdc/v1/foods/search",
            params={
                "api_key": FDC_API_KEY,
                "query": recognized_food,
                "pageSize": 1
            }
        )

        if response.status_code == 200:
            data = response.json()
            if 'foods' in data and len(data['foods']) > 0:
                food_nutrients = data['foods'][0].get('foodNutrients', [])
                for nutrient in food_nutrients:
                    if nutrient.get('nutrientName') == 'Energy':
                        energy_value = nutrient.get('value')
                        unit = nutrient.get('unitName')
                        return jsonify({
                            "recognized_food": recognized_food,
                            "calories": f"{energy_value}"
                        })
            return jsonify({"error": "Energy (KCAL) information not found."}), 404
        else:
            return jsonify({"error": "Failed to get data from FoodData Central."}), 500
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve nutrition data: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True)
