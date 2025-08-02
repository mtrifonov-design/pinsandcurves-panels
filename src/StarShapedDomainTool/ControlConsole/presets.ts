//import { LISSAJOUS_CURVES } from "../core/lissajousCurves";


const presets = {
    // star, lotus, heart
    daisy: { 
        "width": 1920, 
        "height": 1080, 
        "colorStops": [{ "color": { "r": 0.7789670312499999, "g": 1, "b": 0.25749999999999995 }, "position": 0.03631344833815029, "id": "9b2af099-7ee7-41ba-9889-d63f53d86078" }, { "color": { "r": 0.93090625, "g": 0.3761339062178194, "b": 0.0366980698242188 }, "position": 0.22652863078034682, "id": "70c89263-47ae-42fe-9927-95d37eb9869f" }, { "color": { "r": 0.8087781817674637, "g": 0.6524299011230469, "b": 0.916796875 }, "position": 0.5860560422687862, "id": "ecd6b632-4262-4a2e-b548-2b4ee772e5a7" }, { "color": { "r": 0.4684095249023437, "g": 0.8900270055666961, "b": 0.89559375 }, "position": 0.7418600975433526, "id": "d2d952ca-b8f4-4446-9460-464ed778438e" }],
        "canvasPoint": [-0.04, -0.04], 
        "canvasScale": 0.33, 
        "shapeScale": 0.36, 
        "shapePoint": [-0.01, -0.01], 
        "perspectiveFactor": 0.1, 
        "noiseDegenerationEnabled": false, 
        "noiseDegenerationAmplitude": 0.5, 
        "noiseDegenerationFrequency": 1, 
        "speed": 0.66, 
        "exportDuration": 10, 
        "exportPerfectLoop": true, 
        "shapeImageAssetId": "daisy_shape.png", 
        "shapeImageAssetIds": ["daisy_shape.png", "star_shape.png", "heart_shape.png"], 
        "showShapeInspector": false, 
        "grainEnabled": true, 
        "grainIntensity": 0.15, 
        "overlayShape": false 
    },

    arcade: {
        "width":1920,
        "height":1080,
        "colorStops":[{"color":{"r":0.01,"g":0.00998308125,"b":0.0099},"position":0,"id":"9b2af099-7ee7-41ba-9889-d63f53d86078"},{"color":{"r":1,"g":0.3659375,"b":0.3659375},"position":0.028331602239884394,"id":"70c89263-47ae-42fe-9927-95d37eb9869f"},{"color":{"r":1,"g":0.9253397851562499,"b":0.58665625},"position":0.08521495664739884,"id":"0f91ae11-bf42-40ea-ab95-30b5b8e885a6"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.18932893786127167,"id":"2c0c0939-095e-4bae-9f6d-024181ba5450"},{"color":{"r":0.009997142857142857,"g":0.01,"b":0.0099},"position":0.2303332731213873,"id":"d2d952ca-b8f4-4446-9460-464ed778438e"},{"color":{"r":0,"g":0.9215686274509803,"b":0.2976954656862746},"position":0.3204423320086705,"id":"ecd6b632-4262-4a2e-b548-2b4ee772e5a7"},{"color":{"r":0.6352941176470588,"g":1,"b":0.9411911764705883},"position":0.3819939938583815,"id":"d2b0a649-00a1-4a2e-88e7-0415513828b4"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.4643639360549133,"id":"915b3fe4-766a-4282-85ac-72981402a7cb"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.5065536940028902,"id":"74932177-dd61-42de-a403-07eb13ebb240"},{"color":{"r":0,"g":0.08818750000000009,"b":1},"position":0.5925024837427746,"id":"27b41890-87f9-47e4-a94a-06aeba2b458b"},{"color":{"r":0.21568627450980393,"g":0.2391911764705883,"b":1},"position":0.6597611091040463,"id":"65a21e80-46c2-4fab-9c3c-c20c0cfec7da"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.7244964776011561,"id":"05410c20-cbea-4292-ada8-f391c4ad0766"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.780013773482659,"id":"296b1e7f-7d1b-404f-8e24-7c84853293e3"},{"color":{"r":1,"g":0,"b":0.5769375000000005},"position":0.848491690751445,"id":"b733d01b-c9fe-4755-bb3e-291b7dbc235f"},{"color":{"r":1,"g":0.399734375,"b":0.5717667514648436},"position":0.8842575867052023,"id":"51165c66-def5-40f2-b532-059bdad8ade7"},{"color":{"r":0.01,"g":0.0099,"b":0.0099},"position":0.9248554913294798,"id":"3111c12d-32b2-4382-aa8f-34b3f86f892b"}],
        "canvasPoint":[-0.04,-0.04],"canvasScale":1.31,"shapeScale":0.36,"shapePoint":[-0.01,-0.01],"perspectiveFactor":0.59,"noiseDegenerationEnabled":false,"noiseDegenerationAmplitude":0.5,"noiseDegenerationFrequency":1,"speed":0.51,"exportDuration":10,"exportPerfectLoop":true,
        "shapeImageAssetId":"star_shape.png",
        "shapeImageAssetIds": ["daisy_shape.png", "star_shape.png", "heart_shape.png"], 
        "showShapeInspector":false,"grainEnabled":true,"grainIntensity":0.47,"overlayShape":false},

    love: {
        "width":1920,"height":1080,
        "colorStops":[{"color":{"r":0.37534375,"g":0,"b":0.12681926953125014},"position":0.060309790462427744,"id":"9b2af099-7ee7-41ba-9889-d63f53d86078"},{"color":{"r":1,"g":0.41870312499999995,"b":0.4769599711914061},"position":0.29274295520231214,"id":"cb8dc445-e2de-48bd-bd44-77ff6e4108aa"},{"color":{"r":1,"g":0.8818098958333335,"b":0.7163437500000001},"position":0.3979915552745665,"id":"ecd6b632-4262-4a2e-b548-2b4ee772e5a7"},{"color":{"r":1,"g":0.7190296948242195,"b":0.281578125},"position":0.6822954299132948,"id":"bff39565-4df6-4eb8-a421-b20ad7bc7536"}],
        "canvasPoint":[-0.04,-0.04],"canvasScale":0.22,"shapeScale":0.36,"shapePoint":[0.01,0.02],"perspectiveFactor":0.63,"noiseDegenerationEnabled":false,"noiseDegenerationAmplitude":0.5,"noiseDegenerationFrequency":1,"speed":0.77,"exportDuration":10,"exportPerfectLoop":true,
        "shapeImageAssetId":"heart_shape.png",
        "shapeImageAssetIds": ["daisy_shape.png", "star_shape.png", "heart_shape.png"], 
        "showShapeInspector":false,"grainEnabled":true,"grainIntensity":0.47,"overlayShape":true}

};

export default presets;

