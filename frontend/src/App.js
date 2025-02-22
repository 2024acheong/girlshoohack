import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import React, { useState, useRef, useEffect } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [totalCalories, setTotalCalories] = useState(0);
  const [lifetimeEntries, setLifetimeEntries] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [currentEntry, setCurrentEntry] = useState([]);
  const [foodInputMethod, setFoodInputMethod] = useState('');
  const [recognizedFood, setRecognizedFood] = useState(null);
  const [manualFood, setManualFood] = useState('');
  const [manualCalories, setManualCalories] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    setFoodInputMethod('camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // Capture the photo from the video feed and send it to backend
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert the canvas content to an image blob (JPEG format)
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('file', blob);

      try {
        const response = await fetch('http://127.0.0.1:5000/api/recognize-food', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          const { recognized_food, calories } = data;
          setRecognizedFood({ name: recognized_food, calories: parseFloat(calories) });
        } else {
          console.error('Error:', data.error);
          alert('Failed to recognize food');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('Error recognizing food. Please try again.');
      }
    }, 'image/jpeg');
  };

  // Add recognized food to the current entry
  const handleAddRecognizedFood = () => {
    if (recognizedFood) {
      setCurrentEntry([...currentEntry, recognizedFood]);
      setRecognizedFood(null);
    }
  };

  // Handle manual input of food
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualFood && manualCalories) {
      setCurrentEntry([...currentEntry, { name: manualFood, calories: parseFloat(manualCalories) }]);
      setManualFood('');
      setManualCalories('');
    }
  };

  // Add current entry to the daily and lifetime trackers
  const handleFinishEntry = () => {
    const entryCalories = currentEntry.reduce((acc, food) => acc + parseFloat(food.calories), 0);
    setDailyCalories(dailyCalories + entryCalories);
    setTotalCalories(totalCalories + entryCalories);
    setLifetimeEntries([...lifetimeEntries, { date: new Date().toLocaleString(), foods: currentEntry, totalCalories: entryCalories }]);
    setCurrentEntry([]);
  };

  // Reset daily calories at midnight
  useEffect(() => {
    const resetDailyCalories = () => {
      setDailyCalories(0);
    };

    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0); // Set to midnight

    const timeout = midnight.getTime() - new Date().getTime();
    const timer = setTimeout(() => {
      resetDailyCalories();
      setInterval(resetDailyCalories, 24 * 60 * 60 * 1000); // Reset daily every 24 hours
    }, timeout);

    return () => clearTimeout(timer); // Cleanup
  }, []);

  // Sign up a new user
  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, signUpEmail, signUpPassword);
      setUser(userCredential.user);
      setSignUpEmail('');
      setSignUpPassword('');
    } catch (error) {
      console.error("Error signing up: ", error);
    }
  };

  // Log in an existing user
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, loginPassword);
      setUser(userCredential.user);
      setLoginEmail('');
      setLoginPassword('');
    } catch (error) {
      console.error("Error logging in: ", error);
    }
  };

  // Log out the current user
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/" replace />
            ) : (
              <div className="auth">
                <form onSubmit={handleSignUp}>
                  <h2>Sign Up</h2>
                  <label>
                    Email:
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Password:
                    <input
                      type="password"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      required
                    />
                  </label>
                  <button type="submit">Sign Up</button>
                </form>
                <form onSubmit={handleLogin}>
                  <h2>Login</h2>
                  <label>
                    Email:
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </label>
                  <label>
                    Password:
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </label>
                  <button type="submit">Login</button>
                </form>
              </div>
            )
          }
        />
    {/* Protected App Route */}
    <Route
          path="/"
          element={
            user ? (
              <div className="App">
                <h1>Food Calorie Tracker</h1>
                <div>
                  <h2>Welcome, {user.email}!</h2>
                  <button onClick={handleLogout}>Logout</button>
                </div>
                <div className="input-methods">
                  <button onClick={() => setFoodInputMethod('manual')}>Manual Input</button>
                  <button onClick={startCamera}>Take a Photo</button>
                </div>

                {/* Manual food input */}
                {foodInputMethod === 'manual' && (
                  <form onSubmit={handleManualSubmit} className="manual-input">
                    <h2>Manual Food Entry</h2>
                    <label>
                      Food:
                      <input
                        type="text"
                        value={manualFood}
                        onChange={(e) => setManualFood(e.target.value)}
                        required
                      />
                    </label>
                    <label>
                      Calories:
                      <input
                        type="number"
                        value={manualCalories}
                        onChange={(e) => setManualCalories(e.target.value)}
                        required
                      />
                    </label>
                    <button type="submit" className="add-btn">Add Food</button>
                  </form>
                )}

                {/* Camera and photo capture */}
                {foodInputMethod === 'camera' && (
                  <div className="camera-section">
                    <video ref={videoRef} autoPlay style={{ width: '100%', height: 'auto' }}></video>
                    <button onClick={captureImage} className="capture-btn">Capture</button>
                    <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                    {recognizedFood && (
                      <div className="recognized-food">
                        <p>Recognized Food: {recognizedFood.name} - {recognizedFood.calories} calories</p>
                        <button onClick={handleAddRecognizedFood} className="add-btn">Add to Entry</button>
                      </div>
                    )}
                  </div>
                )}

                {/* Display current entry */}
                {currentEntry.length > 0 && (
                  <div className="current-entry">
                    <h3>Current Entry</h3>
                    <ul>
                      {currentEntry.map((food, index) => (
                        <li key={index}>{food.name} - {food.calories} calories</li>
                      ))}
                    </ul>
                    <button onClick={handleFinishEntry} className="finish-btn">Finish Entry</button>
                  </div>
                )}

                <h2>Daily Calories: {dailyCalories}</h2>

                <h2>Total Lifetime Calories: {totalCalories}</h2>

                {/* Lifetime entries */}
                <div className="lifetime-entries">
                  <h3>Lifetime Entries</h3>
                  {lifetimeEntries.length > 0 ? (
                    <ul>
                      {lifetimeEntries.map((entry, index) => (
                        <li key={index}>
                          {entry.date} - {entry.totalCalories} calories
                          <ul>
                            {entry.foods.map((food, i) => (
                              <li key={i}>{food.name} - {food.calories} calories</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p>No entries yet</p>
                  )}
                </div>
              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
