let isVideoSet = false;
// const videoFile = document.getElementById('videoFile');
const video = document.getElementById('video');
const srcStatusText = document.getElementById('srcStatusText');

const startBtn = document.querySelector('.start-button');
const outputCanvas = document.getElementById('output-canvas');
const outputVideoWrapper = document.getElementById('outputVideoWrapper');

let canvasWidth;
let canvasHeight;

let c_out;
let ctx_out;
let c_tmp;
let ctx_tmp;

/* webcam start function */
function startWebcam() {
	isVideoSet = true;
	if (navigator.mediaDevices.getUserMedia) {
		navigator.mediaDevices
			.getUserMedia({ 
video: { 
width: { min: 240, max:360  },
		height: { min: 240, max: 360 }
}
 })
			.then(function (stream) {
				video.srcObject = stream;
setTimeout(function() { startProcess(); }, 2000);
				
			})
			.catch(function (err) {
				console.log('Something went wrong!');
			//alert('problem : '+err);
			});
	}
	video.autoplay = true;

	// video.style.display = 'initial';

	/* video src selection status */
// 	srcStatusText.innerHTML =
// 		"<span style='color: green;'>Webcam started.</span>";

	/* button view style */
// 	startBtn.innerHTML = 'Start Processing';
// 	startBtn.style.cursor = 'pointer';
// 	startBtn.disabled = false;
}

/* change video src to selected video file src */
// videoFile.addEventListener(
// 	'change',
// 	function () {
// 		isVideoSet = true;
// 		for (let i = 0; i < videoFile.files.length; i++) {
// 			video.src = URL.createObjectURL(this.files[i]);
// 			video.play();

// 			// video.style.display = 'initial';

// 			/* video src selection status */
// 			srcStatusText.innerHTML =
// 				"<span style='color: green;'>Video selected.</span>";

// 			/* button view style */
// 			startBtn.innerHTML = 'Start Processing';
// 			startBtn.style.cursor = 'pointer';
// 			startBtn.disabled = false;
// 		}
// 	},
// 	false
// );

/* set output canvas resolution */
video.addEventListener(
	'loadeddata',
	function () {
		// console.log('video content loaded.');

		// console.log('videoWidth', video.videoWidth);
		// console.log('videoHeight', video.videoHeight);

		// console.log('video.offsetWidth', video.offsetWidth);
		// console.log('video.offsetHeight', video.offsetHeight);

		/* limiting canvas resolution for visual */
		if (window.innerWidth <= 800) {
			canvasWidth = window.innerWidth - 22; /* 22px left for padding */
		} else if (video.videoWidth > 800) {
			canvasWidth = 800;
		} else {
			canvasWidth = video.videoWidth;
		}

		canvasHeight = Math.ceil(
			canvasWidth / (video.videoWidth / video.videoHeight)
		);

		// canvasWidth = video.offsetWidth;
		// canvasHeight = Math.ceil(
		// 	canvasWidth / (video.videoWidth / video.videoHeight)
		// );

		/* set canvas size based on the image container */
		outputCanvas.setAttribute('width', canvasWidth);
		outputCanvas.setAttribute('height', canvasHeight);
	},
	false
);

/* opencv load status log */
function onOpenCvReady() {
	console.log('OpenCV.js is ready.');
	startWebcam();
}

/* process video on canvas */
function processVideo() {
	c_out = document.getElementById('output-canvas');
	ctx_out = c_out.getContext('2d');

	/* temporary canvas */
	c_tmp = document.createElement('canvas');
	c_tmp.setAttribute('width', canvasWidth);
	c_tmp.setAttribute('height', canvasHeight);
	ctx_tmp = c_tmp.getContext('2d');

	video.play();

	computeFrame();
}

/* process video frames */
function computeFrame() {
	/* draw a frame of the video on a temporary canvas */
	ctx_tmp.drawImage(video, 0, 0, c_out.width, c_out.height);
	let frame = ctx_tmp.getImageData(0, 0, c_out.width, c_out.height);

	/* detect objects' shapes and colors in frame */
	try{
detectShapeWithColor(frame);
}catch(e){
alert(e);
}

	// /* output the frames on canvas */
	// ctx_out.putImageData(frame, 0, 0);
	//setTimeout(computeFrame, 0);
requestAnimationFrame(computeFrame);
}

/* ----------------------------------------------- */
/* ---------- Color Detection functions ---------- */

/* convert rgb color to hsl */
function convertToHsl(rgbColorCode) {
	const r = Number(rgbColorCode.r) / 255;
	const g = Number(rgbColorCode.g) / 255;
	const b = Number(rgbColorCode.b) / 255;
	const maxColorValue = Math.max(r, g, b);
	const minColorValue = Math.min(r, g, b);
	let H = 0;
	let S = 0;
	let L = (maxColorValue + minColorValue) / 2;

	if (maxColorValue != minColorValue) {
		if (L < 0.5) {
			S =
				(maxColorValue - minColorValue) /
				(maxColorValue + minColorValue);
		} else {
			S =
				(maxColorValue - minColorValue) /
				(2.0 - maxColorValue - minColorValue);
		}
		if (r == maxColorValue) {
			H = (g - b) / (maxColorValue - minColorValue);
		} else if (g == maxColorValue) {
			H = 2.0 + (b - r) / (maxColorValue - minColorValue);
		} else {
			H = 4.0 + (r - g) / (maxColorValue - minColorValue);
		}
	}

	H = H * 60;
	S = S * 100;
	L = L * 100;

	if (H < 0) {
		H += 360;
	}

	const hslColorCode = { h: H, s: S, l: L };

	return hslColorCode;
}

/* get the base color name */
function getBaseColorName(hsl) {
	const h = Math.floor(hsl.h);
	const s = Math.floor(hsl.s);
	const l = Math.floor(hsl.l);

	if (l >= 95 || (s <= 10 && l >= 90)) {
		return 'White';
	} else if (l <= 5 || (h <= 15 && s <= 15 && l <= 15)) {
		return 'Black';
	} else if ((s <= 10 && l <= 70) || s === 0) {
		return 'Gray';
	} else if ((h >= 0 && h <= 15) || h >= 346) {
		return 'Red';
	} else if (h >= 45 && h <= 65) {
		if (s > 90 && l >= 45 && l <= 85) {
			return 'Yellow';
		}
	} else if (h >= 15 && h <= 50) {
		if (s < 90 && l <= 40) {
			return 'Brown';
		} else {
			return 'Orange';
		}
	} else if (h >= 55 && h <= 165) {
		return 'Green';
	} else if (h >= 166 && h <= 260) {
		return 'Blue';
	} else if (h >= 261 && h <= 290) {
		return 'Purple';
	} else if (h >= 291 && h <= 345) {
		return 'Pink';
	} else {
		return 'Unknown';
	}
}

/* get intensity of the color */
function getColorIntensity(rgbColorCode) {
	let hex = '';
	hex += Number(rgbColorCode.r).toString(16);
	hex += Number(rgbColorCode.g).toString(16);
	hex += Number(rgbColorCode.b).toString(16);
	let intensity = '';
	const rgb = parseInt(hex, 16);
	const r = (rgb >> 16) & 0xff;
	const g = (rgb >> 8) & 0xff;
	const b = (rgb >> 0) & 0xff;
	const intensityValue = 0.2126 * r + 0.7152 * g + 0.0722 * b;

	if (intensityValue >= 80 && intensityValue <= 100) {
		intensity = 'Semi dark';
	} else if (intensityValue < 80) {
		intensity = 'Dark';
	} else {
		intensity = 'Light';
	}
	return intensity;
}

/* determine color name from color code */
function determineColor(rgbColorCode) {
	const colorName =
		getColorIntensity(rgbColorCode) +
		'_' +
		getBaseColorName(convertToHsl(rgbColorCode));

	// console.log(colorName);

	return colorName;
}

/* detect color of the object */
function detectColor(src, contours, cntIndex, cnt) {
	let mask = cv.Mat.zeros(src.rows, src.cols, cv.CV_8U);

	/* draw current contour mask */
	cv.drawContours(mask, contours, cntIndex, new cv.Scalar(255, 255, 255), -1);

	/* get roi for color detection */
	const boundingAreaRect = cv.boundingRect(cnt);
	const srcRoi = src.roi(boundingAreaRect);
	const maskRoi = mask.roi(boundingAreaRect);

	mask.delete();

	// cv.imshow('output-canvas', srcRoi);
	// cv.imshow('output-canvas', maskRoi);

	/* get mean color of roi in src */
	const meanColor = cv.mean(srcRoi, maskRoi);

	srcRoi.delete();
	maskRoi.delete();

	/* get rgb code */
	const rgbColorCode = {
		r: Math.round(meanColor[0]),
		g: Math.round(meanColor[1]),
		b: Math.round(meanColor[2])
	};

	const color = determineColor(rgbColorCode);

	return color;
}

/* ----------------------------------------------- */
/* ---------- Shape Detection functions ---------- */

/* determine shapes based on sides */
function determineShape(cnt) {
	let shape = 'unknown';
	const perimeter = cv.arcLength(cnt, true);
	let epsilon = 0.04 * perimeter;
	let approx = new cv.Mat();

	/* approximate cnt with approxPolyDP */
	cv.approxPolyDP(cnt, approx, epsilon, true);

	let sides = approx.rows;
//if(isSecond){
//document.getElementById("status").InnerHTML = "sides = "+ sides;
//alert(sides);
//}
// if(sides < 3 ){
//  alert(sides);
// }
	if (sides === 3 ) {
		shape = 'Triangle';
	}else if (sides === 4) {
shape = "rect";
}
	//document.getElementById("status").InnerHTML = "sides = "+ sides;
// 	document.getElementById("status").innerHTML = 


	return shape;
}

/* detect the shape of the object */
function detectShapeWithColor(img) {
	const src = cv.matFromImageData(img);
	let tempSrc = src.clone();
//try{
//let nx = (tempSrc.size().width/2) - 50;
//let ny = (tempSrc.size().height/2) - 50;
//let rect = new cv.Rect(nx, ny, 100, 100);
	// const dst = cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC3);
//tempSrc = tempSrc.roi(rect);
//}catch(err){ alert("YMZ :"+err);}
	/* blurring src with gaussian blur */
	const kernelSize = new cv.Size(5, 5);
	//cv.GaussianBlur(tempSrc, tempSrc, kernelSize, 0, 0, cv.BORDER_DEFAULT);

	/* convert src to grayscale image */
	cv.cvtColor(tempSrc, tempSrc, cv.COLOR_BGR2GRAY, 0);

	/* canny edge detection */
	// cv.Canny(src, src, 20, 80, 3, true);
	//cv.Canny(tempSrc, tempSrc, 20, 100, 3, false);

	// /* morphological operation (dilate) */
	// const M = cv.Mat.ones(3, 3, cv.CV_8U);
	// const anchor = new cv.Point(-1, -1);
	// cv.dilate(
	// 	src,
	// 	src,
	// 	M,
	// 	anchor,
	// 	1,
	// 	cv.BORDER_CONSTANT,
	// 	cv.morphologyDefaultBorderValue()
	// );

	/* morphological operation (closing) */
	//const M = cv.Mat.ones(5, 5, cv.CV_8U);
	//cv.morphologyEx(tempSrc, tempSrc, cv.MORPH_CLOSE, M);

	//M.delete();

	// /* adaptive thresholding with gaussian method */
	// cv.adaptiveThreshold(
	// 	src,
	// 	src,
	// 	230,
	// 	cv.ADAPTIVE_THRESH_GAUSSIAN_C,
	// 	cv.THRESH_BINARY,
	// 	13,
	// 	7
	// );

	/* simple thresholding */
	cv.threshold(tempSrc, tempSrc, 0, 255, cv.THRESH_BINARY_INV+cv.THRESH_OTSU);

	/* find contours */
	let contours = new cv.MatVector();
	let hierarchy = new cv.Mat();

	cv.findContours(
		tempSrc,
		contours,
		hierarchy,
		cv.RETR_TREE,
		cv.CHAIN_APPROX_NONE
	);

	tempSrc.delete();

	/* check every contour to detect shape */
	for (let i = 0; i < contours.size(); i++) {
		const cnt = contours.get(i);

		/* determine coordinates for putting label */
		const moment = cv.moments(cnt, false);
		const x =
			moment['m00'] === 0 ? 0 : Math.round(moment['m10'] / moment['m00']);
		const y =
			moment['m00'] === 0 ? 0 : Math.round(moment['m01'] / moment['m00']);
		const org = { x, y }; /* label coordinates */

		const contourArea = moment['m00'];
		// const contourArea = cv.contourArea(cnt);

		/* exclude smaller contours for reducing noise */

/* default 1000 */
		if (contourArea > 100 ) {
			// console.log(contourArea);

			/* get the shape of current cnt */
			const shapeName = determineShape(cnt);
			
		
			if(shapeName == 'rect'){
				
const parent = hierarchy.intPtr(0,i)[2];
if(parent != -1 /*&& hierarchy.intPtr(0,parent)[2] === -1 */) {
	
// 	document.getElementById("status").innerHTML = "i = "+ i+ "triangle parent = " + parent;

const ccnt = contours.get(parent);

		/* determine coordinates for putting label */
		//const cmoment = cv.moments(ccnt, false);
		//const cx =
	//		cmoment['m00'] === 0 ? 0 : Math.round(cmoment['m10'] / cmoment['m00']);
	//	const cy =
	//		cmoment['m00'] === 0 ? 0 : Math.round(cmoment['m01'] / cmoment['m00']);
	//	const corg = { cx, cy }; /* label coordinates */

		//const ccontourArea = cmoment['m00'];
		
	//document.getElementById("status").innerHTML = "detecting parent ";
	//if (ccontourArea > 100){
const parentShape = determineShape(ccnt);
	//document.getElementById("status").innerHTML = "parent detected";
if(parentShape == 'Triangle'){
	
	//document.getElementById("status").innerHTML = "parent is triangle";
			/* get color of current cnt */
			//const shapeColor = detectColor(src, contours, i, cnt);
				//var child  = hierarchy.intPtr(0,i)[2];
				//var parent = hierarchy.intPtr(0,i)[3];
 			var labelText = contourArea + " " /*+' child = ' +   child + ' parent = '+ parent*/;

	//document.getElementById("status").innerHTML = "label set";
			// /* generates random color */
			// const color = new cv.Scalar(
			// 	Math.round(Math.random() * 255),
			// 	Math.round(Math.random() * 255),
			// 	Math.round(Math.random() * 255),
			// 	255
			// );
			// console.log(color);

			/* fixed cntColor */
			const cntColor = [0, 255, 0, 255];
			// const cntColor = [0, 0, 0, 255];
			const cntThickness = 2;

			/* draw contours on output canvas */
			cv.drawContours(
				src,
				contours,
				i,
				cntColor,
				cntThickness,
				cv.LINE_8,
				hierarchy,
				0
			);

	//document.getElementById("status").innerHTML = "shape drawn";
	
			const fontFace = cv.FONT_HERSHEY_DUPLEX;
			const fontScale = 0.5;
			const fontColor = [255, 55, 35, 255];
			const fontThickness = 1;
			const fontBackColor = [255, 255, 255, 255];
			const fontBackThickness = 2;

			/* font border */

 			cv.putText(
 				src,
				labelText,
				org,
				fontFace,
				fontScale,
				fontBackColor,
				fontBackThickness
			);

			/* put label on detected shape */
 			cv.putText(
 				src,
 				labelText,
				org,
				fontFace,
				fontScale,
				fontColor,
 				fontThickness
 			);
	//document.getElementById("status").innerHTML = "text drawn";
				break;
			
}
}

//alert("YMZ parent = "+parentShape);

}
}
	}
			

	/* display output on output-canvas */
	cv.imshow('output-canvas', src);

	contours.delete();
	hierarchy.delete();
	src.delete();
}

/* start process function */
function startProcess() {
	if (isVideoSet) {
		/* button view style */
// 		startBtn.innerHTML = 'Processing...';
// 		startBtn.style.cursor = 'progress';
// 		startBtn.disabled = true;

		processVideo();

		/* make output canvas visible */
		outputVideoWrapper.style.display = 'initial';

		/* button view style */
// 		startBtn.innerHTML = 'Process Running...';
// 		startBtn.style.cursor = 'default';
	} else {
		alert('Please select a video file, or turn on Webcam.');
	}
  
  }
