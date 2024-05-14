var rhit = rhit || {};

rhit.FB_COLLECTION_CART = "Cart";
rhit.FB_COLLECTION_PHOTOS = "Photos";
rhit.FB_COLLECTION_PRODUCTS = "Products";
rhit.FB_COLLECTION_USERS = "User";


rhit.FB_KEY_LAST_UPDATED = "LastTouched";
rhit.FB_KEY_PRODUCT_NAME = "name";
rhit.FB_KEY_PHOTO_URL = "PhotoUrl";
rhit.FB_KEY_PRICE = "price";


// rhit.FB_KEY_IMAGE_URL = "imageURL";
// rhit.FB_KEY_CAPTION = "caption";
// rhit.FB_KEY_NAME = "name";
// rhit.FB_KEY_PHOTO_URL = "photoUrl";

rhit.photoBucketManager = null;
rhit.singlePhotoManager = null;
rhit.authManager = null;
rhit.fbUserManager = null;


rhit.pageUrl = "/mainpage.html";
function convertHtmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.ListPageController = class {
	constructor() {
		document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
			button.addEventListener("click", (event) => {
				let buttonId = button.id;
				buttonId = buttonId.split('-')[4] // ['add','to','cart','btn', 'number']
				console.log("#special_img_"+buttonId);
				const imageURL = document.querySelector("#special_img_"+buttonId).src;
				const name= "try";
				rhit.photoBucketManager.addPhoto(imageURL, name, 100);
			});
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.authManager.signOut();
		});

		document.querySelector("#confirmAddToCart").addEventListener("click", (event) => {
			// const imageURL = document.querySelector("").value;
			// const caption = document.querySelector("#inputCaption").value;
			// rhit.photoBucketManager.addPhoto(imageURL, caption);
		});

		rhit.photoBucketManager.startListening(this.updatePhotoList.bind(this));
	}
	updatePhotoList() {
		console.log("Updating the photo list on the page");

		const newPhotoList = convertHtmlToElement('<div id="columns"></div>');
		for (let i = 0; i < rhit.photoBucketManager.numberOfPhotos; i++) {
			const photo = rhit.photoBucketManager.getPhotoByIndex(i);
			const photoCard = this.createPhotoCard(photo);

			photoCard.onclick = () => {
				window.location.href = `/cart.html?id=${photo.id}`;
			}

			newPhotoList.appendChild(photoCard);
		}
		// const oldPhotoList = document.querySelector("#columns");
		// oldPhotoList.removeAttribute("id");
		// oldPhotoList.hidden = true;
		// oldPhotoList.parentElement.appendChild(newPhotoList);
	}
	createPhotoCard(photo) {
		return convertHtmlToElement(`<div class="pin" id="${photo.id}">
        <img src="${photo.imageURL}" alt="${photo.caption}">
        <p class="caption">${photo.caption}</p>
      </div>`);
	}
}

rhit.Photo = class {
	constructor(id, imageURL, caption) {
		this.id = id;
		this.imageURL = imageURL;
		this.caption = caption;
	}
}

rhit.PhotoBucketManager = class {
	constructor(userId) {
		this.userId = userId;
		this.documentSnapshots = [];
		this.dbRef = firebase.firestore().collection(rhit.FB_COLLECTION_PRODUCTS);
		this.unsubscribe = null;
	}
	addPhoto(imageURL, name, price) {
		this.dbRef.add({
			[rhit.FB_KEY_PHOTO_URL]: imageURL,
			[rhit.FB_KEY_PRODUCT_NAME]: name,
			[rhit.FB_KEY_LAST_UPDATED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_PRICE]: price
		})
			.then(docRef => {
				console.log("Document written with ID: ", docRef.id);
			})
			.catch(error => {
				console.error("Error adding document: ", error);
			});
	}
	startListening(changeListener) {
		let query = this.dbRef.orderBy(rhit.FB_KEY_LAST_UPDATED , "desc").limit(50);
		if (this.userId) {
			query = query.where(rhit.KEY_AUTHOR, "==", this.userId);
		}
		this.unsubscribe = query.onSnapshot(querySnapshot => {
			console.log("PhotoBucket update");
			this.documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this.unsubscribe();
	}
	get numberOfPhotos() {
		return this.documentSnapshots.length;
	}
	getPhotoByIndex(index) {
		const doc = this.documentSnapshots[index];
		return new rhit.Photo(
			doc.id,
			doc.get(rhit.FB_KEY_PHOTO_URL),
			doc.get(rhit.FB_KEY_PRODUCT_NAME));
	}
}

rhit.PhotoPageController = class {
	constructor() {
		document.querySelector("#menuSignOut").addEventListener("click", () => {
			rhit.authManager.signOut();
		});

		document.querySelector("#submitEditCaption").addEventListener("click", () => {
			const caption = document.querySelector("#inputCaption").value;
			rhit.singlePhotoManager.updateCaption(caption);
		});

		$("#editPhotoDialog").on("show.bs.modal", () => {
			document.querySelector("#inputCaption").value = rhit.singlePhotoManager.caption;
		});
		$("#editPhotoDialog").on("shown.bs.modal", () => {
			document.querySelector("#inputCaption").focus();
		});

		document.querySelector("#submitDeletePhoto").addEventListener("click", () => {
			rhit.singlePhotoManager.deletePhoto().then(() => {
				console.log("Photo successfully deleted");
				window.location.href = "/mainpage.html";
			}).catch(error => {
				console.error("Error removing photo: ", error);
			});
		});

		rhit.singlePhotoManager.startListening(this.updatePhotoView.bind(this));
	}
	updatePhotoView() {
		document.querySelector("#photo").src = rhit.singlePhotoManager.imageURL;
		document.querySelector("#caption").textContent = rhit.singlePhotoManager.caption;
		if (rhit.singlePhotoManager.author === rhit.authManager.uid) {
			document.querySelector("#menuEdit").style.display = "flex";
			document.querySelector("#menuDelete").style.display = "flex";
		}
	}
}

// rhit.SinglePhotoManager = class {
// 	constructor(photoId) {
// 		this.documentSnapshot = {};
// 		this.unsubscribe = null;
// 		this.dbRef = firebase.firestore().collection(rhit.COLLECTION_PHOTOS).doc(photoId);
// 	}
// 	startListening(changeListener) {
// 		this.unsubscribe = this.dbRef.onSnapshot(doc => {
// 			if (doc.exists) {
// 				console.log("Document data:", doc.data());
// 				this.documentSnapshot = doc;
// 				changeListener();
// 			} else {
// 				console.log("No such document!");
// 			}
// 		});
// 	}
// 	stopListening() {
// 		this.unsubscribe();
// 	}
// 	updateCaption(caption) {
// 		this.dbRef.update({
// 			[rhit.KEY_CAPTION]: caption,
// 			[rhit.KEY_LAST_UPDATED]: firebase.firestore.Timestamp.now(),
// 		})
// 			.then(() => {
// 				console.log("Document successfully updated");
// 			})
// 			.catch(error => {
// 				console.error("Error updating document: ", error);
// 			});
// 	}
// 	deletePhoto() {
// 		return this.dbRef.delete();
// 	}
// 	get imageURL() {
// 		return this.documentSnapshot.get(rhit.KEY_IMAGE_URL);
// 	}
// 	get caption() {
// 		return this.documentSnapshot.get(rhit.KEY_CAPTION);
// 	}
// 	get author() {
// 		return this.documentSnapshot.get(rhit.KEY_AUTHOR);
// 	}
// }



rhit.AuthManager = class {
	constructor() {
		this.user = null;
		// this.name = "";
		// this.photoUrl = "";
		console.log("Auth Manager initialized");
	}
	startListening(changeListener) {
		firebase.auth().onAuthStateChanged(user => {
			this.user = user;
			changeListener();
		});
	}
	signOut() {
		firebase.auth().signOut().catch(error => {
			console.error("Sign out error:", error);
		});
	}
	get isSignedIn() {
		return !!this.user;
	}
	get uid() {
		return this.user.uid;
	}
	get name() {
		return this.name;
	}
	get photoUrl() {
		return this.photoUrl;
	}
}

rhit.checkForRedirects = function () {
	if (document.querySelector("#loginPage") && rhit.authManager.isSignedIn) {
		window.location.href = `/mainpage.html`;
	}
	if (!document.querySelector("#loginPage") && !rhit.authManager.isSignedIn) {
		window.location.href = "/";
	}
};

rhit.initializePage = function () {
	if (document.querySelector("#mainPage")) {
		const urlParams = new URLSearchParams(window.location.search);
		const userId = urlParams.get("uid");
		rhit.photoBucketManager = new rhit.PhotoBucketManager(userId);
		new rhit.ListPageController();
	}
	if (document.querySelector("#cartPage")) {
		new rhit.ListPageController();
		// new rhit.PhotoPageController();
	}
	if (document.querySelector("#orderPage")) {
		new rhit.ListPageController();
		// new rhit.PhotoPageController();
	}
	if (document.querySelector("#loginPage")) {
		rhit.startFirebaseUI();

	}
	console.log("Hello");
	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page.");
		new rhit.ProfilePageController();
	}

};


rhit.LoginPageController = class {
	constructor() {
		rhit.fbAuthManager.startFirebaseAuthUi();
	}
}

rhit.startFirebaseUI = function () {
	var uiConfig = {
		signInSuccessUrl: '/mainpage.html',
		signInOptions: [
			firebase.auth.GoogleAuthProvider.PROVIDER_ID,
			firebase.auth.EmailAuthProvider.PROVIDER_ID,
			firebase.auth.PhoneAuthProvider.PROVIDER_ID,
			firebaseui.auth.AnonymousAuthProvider.PROVIDER_ID
		],
	};
	const ui = new firebaseui.auth.AuthUI(firebase.auth());
	ui.start('#firebaseui-auth-container', uiConfig);
}


rhit.ProfilePageController = class {
	constructor() {
		console.log("Created Profile page controller");
	}

	updateView() {

	}

}


rhit.FbUserManager = class {

	constructor() {
		this._collectionRef = firebase.firestore().collection(rhit.FB_COLLECTION_USERS);
		this._document = null;
		console.log("Create a user manager");
	}

	addNewUserMaybe(uid, name, photoUrl) {

	}
	beginListening(uid, changeListener) { }
	stopListening() {
		this._unsubscribe();
	}
	updatePhotoUrl(photoUrl) { }
	updateName(name) { }
	get name() {
		return this._document.get(rhit.FB_KEY_NAME);
	}

	get photoUrl() {
		return this._document.get(rhit.FB_KEY_PHOTO_URL);
	}

}




function searchItems(value) {
	const searchTerm = value.toLowerCase().trim();

	// Define mappings from keywords to element IDs
	const keywordToSection = {
		'rackets': 'rackets',
		'shoes': 'shoes',
		'bags': 'bags',
		'tennis bag': 'tennis bag',
		'yonex tennis bag': 'yonex tennis bag',
		'head tennis bag': 'head tennis bag'
	};

	// Find the section ID based on the search term
	Object.keys(keywordToSection).forEach(key => {
		if (searchTerm.includes(key)) {
			const sectionId = keywordToSection[key];
			document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
		}
	});
}

rhit.createUserObjectIfNeeded = function () {
	return new Promise((resolve, reject) => {


		//check if a User might be new
		if (!rhit.authManager.isSignedIn) {
			resolve();
			return;
		}
		if (!document.querySelector("#loginPage")) {
			resolve();
			return;
		}
		//call add useNewUserMaybe

		// rhit.fbUserManager.addNewUserMaybe(
		// 	rhit.authManager.uid,
		// 	rhit.authManager.name,
		// 	rhit.authManager.photoUrl
		// ).then(() => {
		// 	resolve();
		// });
		resolve();
		console.log("Check");
	});

}


rhit.main = function () {
	rhit.authManager = new rhit.AuthManager();
	rhit.fbUserManager = new rhit.FbUserManager();
	rhit.authManager.startListening(() => {
		console.log("isSignedIn = ", rhit.authManager.isSignedIn);

		//Check if a new user is needed
		rhit.createUserObjectIfNeeded().then(() => {
			rhit.checkForRedirects();
			rhit.initializePage();
		});

	});
};

rhit.main();

