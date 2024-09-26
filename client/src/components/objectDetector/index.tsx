import React, { useRef, useState } from "react";
import axios from "axios";
import "tailwindcss/tailwind.css";
import { AiFillCheckCircle, AiFillCloseCircle } from "react-icons/ai";

const models = [
  "denseNetModel",
  "inceptionV3",
  "Xception",
  "cnnscratch",
  "vgg19",
];

const classNames = [
  "glioma",
  "meningioma",
  "no_tumor",
  "pituitary",
];

export function ObjectDetector() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<Record<string, { classIndex: number | null, percentages: number[] | null }>>({});

  const onSelectImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    const formData = new FormData();
    formData.append("file", file);

    const newPredictions: Record<string, { classIndex: number | null, percentages: number[] | null }> = {};
    for (const model of models) {
      const startTime = new Date();
      try {
        const response = await axios.post(
          `http://127.0.0.1:5000/predict/${model}`,
          formData
        );
        const { data } = response;
        newPredictions[model] = {
          classIndex: data.predicted_class,
          percentages: data.prediction_percentages,
        };
      } catch (error) {
        console.error(`Error occurred while fetching predictions for ${model}:`, error);
        newPredictions[model] = { classIndex: null, percentages: null };
      }
      const endTime = new Date();
      const timeTaken = Number(endTime) - Number(startTime);
      console.log(`Time taken for ${model}:`, timeTaken, "ms");
    }
    setPredictions(newPredictions);
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-800">
      <div className="w-full max-w-xl p-8 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 rounded-3xl shadow-2xl space-y-6">
        <h1 className="text-4xl font-extrabold text-white text-center">
          Brain Tumor Detector
        </h1>
        <div className="space-y-4">
          <label className="block text-lg font-medium text-gray-300">
            Upload Image
          </label>
          <div className="flex items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-2 px-6 rounded-xl shadow-lg hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
            >
              Choose File
            </button>
            <span className="ml-4 text-md text-gray-400">
              {uploadedImage ? "File selected" : "No file selected"}
            </span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={onSelectImage}
            className="hidden"
          />
        </div>
        {uploadedImage && (
          <div className="mt-6 flex justify-center">
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="w-96 rounded-2xl shadow-lg border-4 border-gray-700"
            />
          </div>
        )}
        <div className="mt-6 space-y-4">
          {Object.keys(predictions).map((model) => {
            const prediction = predictions[model];
            const maxPercentageIndex = prediction.percentages ? prediction.percentages.indexOf(Math.max(...prediction.percentages)) : -1;
            return (
              <div
                key={model}
                className="p-4 bg-gray-700 text-white rounded-2xl shadow-xl flex flex-col space-y-2"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-lg">{model}: </span>
                    <span className="text-lg">
                      {prediction.classIndex !== null ? (
                        <>
                          {classNames[prediction.classIndex]} (Index: {prediction.classIndex})
                        </>
                      ) : (
                        "Error in prediction"
                      )}
                    </span>
                  </div>

                </div>
                {prediction.percentages !== null && (
                  <div className="text-sm text-gray-300">
                    {classNames.map((className, index) => (
                      <div key={index} className="flex justify-between">
                        <span>{className}:</span>
                        <span>{prediction.percentages[index].toFixed(2)}%</span>
                        {index === maxPercentageIndex && (
                          <AiFillCheckCircle className="text-green-400 w-4 h-4 ml-2" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
