import React, { useState, useRef, useEffect } from 'react';
import { auth } from './firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import './App.css';

// Mock food recognition database (replace with API calls)
const mockDatabase = {
  'burger': { name: 'Burger', calories: 354 },
  'apple': { name: 'Apple', calories: 95 },
  'pizza': { name: 'Pizza', calories: 285 }
};

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // Start camera
  const startCamera = async () => {
    setFoodInputMethod('camera');
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
  };

  // Capture the photo from the video feed
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate food recognition (replace with actual API recognition)
    const mockRecognizedFood = 'burger'; // Assume mock database recognizes a burger
    setRecognizedFood(mockDatabase[mockRecognizedFood]);
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
      setCurrentEntry([...currentEntry, { name: manualFood, calories: parseInt(manualCalories) }]);
      setManualFood('');
      setManualCalories('');
    }
  };

  // Add current entry to the daily and lifetime trackers
  const handleFinishEntry = () => {
    const entryCalories = currentEntry.reduce((acc, food) => acc + food.calories, 0);
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error("Error signing up: ", error);
    }
  };

  // Log in an existing user
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setUser(userCredential.user);
      setEmail('');
      setPassword('');
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
    <div className="App">
      <h1>Food Calorie Tracker</h1>

      {/* Authentication Section */}
      {user ? (
        <div>
          <h2>Welcome, {user.email}!</h2>
          <button onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="auth">
          <form onSubmit={handleSignUp}>
            <h2>Sign Up</h2>
            <label>
              Email:
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password:
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button type="submit">Sign Up</button>
          </form>
          <form onSubmit={handleLogin}>
            <h2>Login</h2>
            <label>
              Email:
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password:
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </label>
            <button type="submit">Login</button>
          </form>
        </div>
      )}

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
  );
}

export default App;
