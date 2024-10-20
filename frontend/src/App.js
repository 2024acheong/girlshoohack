import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [totalCalories, setTotalCalories] = useState(0);
  const [currentEntry, setCurrentEntry] = useState([]);
  const [recognizedFood, setRecognizedFood] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start the camera
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // Capture an image from the webcam, send it to the backend for recognition
  const captureImage = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to an image blob (JPEG format)
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob);  // Append the blob to FormData

      try {
        // Send the captured image to the backend for food recognition
        const response = await fetch('http://127.0.0.1:5000/api/recognize-food', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok) {
          // If the request was successful, extract the food category and calories
          const foodCategory = data.category.name;
          const foodCalories = data.calories.value;

          // Update the state with the recognized food and calories
          setRecognizedFood({ category: foodCategory, calories: foodCalories });
          setCurrentEntry([...currentEntry, { name: foodCategory, calories: foodCalories }]);
        } else {
          console.error('Error:', data.error);
          alert('Failed to recognize food');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error recognizing food. Please try again.');
      }
    }, 'image/jpeg');  // Convert the canvas content to JPEG format
  };

  // Finish and save the current food entry, and update the total calories
  const handleFinishEntry = () => {
    const entryCalories = currentEntry.reduce((acc, food) => acc + food.calories, 0);
    setTotalCalories(totalCalories + entryCalories);
    setCurrentEntry([]);
  };

  return (
    <div className="App">
      <h1>Food Calorie Tracker</h1>

      {/* Button to start the webcam feed */}
      <button onClick={startCamera}>Start Camera</button>

      {/* Webcam video feed */}
      <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto' }}></video>

      {/* Button to capture image from the webcam */}
      <button onClick={captureImage}>Capture Image</button>

      {/* Hidden canvas used to capture the image */}
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>

      {/* Display the recognized food and its calorie count */}
      {recognizedFood && (
        <div>
          <p>Recognized Food: {recognizedFood.category} - {recognizedFood.calories} calories</p>
        </div>
      )}

      {/* Display the current entry with food items */}
      {currentEntry.length > 0 && (
        <div>
          <h3>Current Entry</h3>
          <ul>
            {currentEntry.map((food, index) => (
              <li key={index}>{food.name} - {food.calories} calories</li>
            ))}
          </ul>
          <button onClick={handleFinishEntry}>Finish Entry</button>
        </div>
      )}

      {/* Display total calories consumed */}
      <h2>Total Calories: {totalCalories}</h2>
    </div>
  );
}

export default App;
