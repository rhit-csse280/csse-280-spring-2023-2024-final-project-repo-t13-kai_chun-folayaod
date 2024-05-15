var rhit = rhit || {};

rhit.FB_COLLECTION_CART = "Cart";
rhit.FB_COLLECTION_PHOTOS = "Photos";
rhit.FB_COLLECTION_PRODUCTS = "Products";
rhit.FB_COLLECTION_USERS = "User";


rhit.FB_KEY_LAST_UPDATED = "LastTouched";
rhit.FB_KEY_PRODUCT_NAME = "name";
rhit.FB_KEY_PHOTO_URL = "PhotoUrl";
rhit.FB_KEY_PRICE = "price";
rhit.FB_KEY_AUTHOR = "author";


// rhit.FB_KEY_IMAGE_URL = "imageURL";
// rhit.FB_KEY_CAPTION = "caption";
// rhit.FB_KEY_NAME = "name";
// rhit.FB_KEY_PHOTO_URL = "photoUrl";

rhit.productBucketManager = null;
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

rhit.MainpageController = class {
	constructor() {
		document.querySelectorAll(".add-to-cart-btn").forEach((button) => {
			button.addEventListener("click", (event) => {
				let buttonId = button.id;
				buttonId = buttonId.split('-')[4] // ['add','to','cart','btn', 'number']
				console.log("#special_img_"+buttonId);
				const imageURL = document.querySelector("#special_img_"+buttonId).src;
				const name= document.querySelector("#product_name_"+buttonId).textContent;
				console.log(name);
				rhit.productBucketManager.addProduct(imageURL, name, 100);
			});
		});

		document.querySelector("#menuSignOut").addEventListener("click", (event) => {
			rhit.authManager.signOut();
		});

		// document.querySelector("#confirmAddToCart").addEventListener("click", (event) => {
			// const imageURL = document.querySelector("").value;
			// const caption = document.querySelector("#inputCaption").value;
			// rhit.productBucketManager.addProduct(imageURL, caption);
		// });

		// rhit.productBucketManager.startListening(this.updateProductList.bind(this));
		this.updateProductList();
	}
	updateProductList() {
		console.log("Updating the photo list on the page");

		const newProductList = convertHtmlToElement('<div id="columns"></div>');
		console.log(rhit.productBucketManager.numberOfProducts);
		for (let i = 0; i < rhit.productBucketManager.numberOfProducts; i++) {
			const product = rhit.productBucketManager.getProductByIndex(i);
			const productCard = this.createProductCard(product);

			productCard.onclick = () => {
				window.location.href = `/cart.html?id=${product.id}`;
			}

			newProductList.appendChild(productCard);
		}
		// const oldPhotoList = document.querySelector("#columns");
		// oldPhotoList.removeAttribute("id");
		// oldPhotoList.hidden = true;
		// oldPhotoList.parentElement.appendChild(newProductList);
	}
	createProductCard(product) {
		return convertHtmlToElement(`<div class="pin" id="${product.id}">
        <img src="${product.photoUrl}" alt="${product.name}">
        <p class="caption">${product.name}</p>
      </div>`);
	}
}

rhit.Product = class {
	constructor(id, photoUrl, name) {
		this.id = id;
		this.photoUrl = photoUrl;
		this.name= name;
	}
}

rhit.ProductBucketManager = class {
	constructor(userId) {
		this.userId = userId;
		this.documentSnapshots = [];
		this.dbRef = firebase.firestore().collection(rhit.FB_COLLECTION_PRODUCTS);
		this.unsubscribe = null;
	}
	addProduct(imageURL, name, price) {
		this.dbRef.add({
			[rhit.FB_KEY_PHOTO_URL]: imageURL,
			[rhit.FB_KEY_PRODUCT_NAME]: name,
			[rhit.FB_KEY_LAST_UPDATED]: firebase.firestore.Timestamp.now(),
			[rhit.FB_KEY_PRICE]: price,
			[rhit.FB_KEY_AUTHOR]: rhit.authManager.uid
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
		console.log("DDD");
		if (this.userId) {
			query = query.where(rhit.FB_KEY_AUTHOR, "==", this.userId);
		}
		this.unsubscribe = query.onSnapshot(querySnapshot => {
			console.log("ProductBucket update");
			this.documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}
	stopListening() {
		this.unsubscribe();
	}
	get numberOfProducts() {
		return this.documentSnapshots.length;
	}
	getProductByIndex(index) {
		const doc = this.documentSnapshots[index];
		return new rhit.Product(
			doc.id,
			doc.get(rhit.FB_KEY_PHOTO_URL),
			doc.get(rhit.FB_KEY_PRODUCT_NAME));
	}
}

rhit.CartManager = class {
	constructor(userId) {
		
		rhit.productBucketManager.startListening(this.updateProductList.bind(this));
	}
	updateProductList() {
		console.log("Updating the photo list on the page");

		const newProductList = convertHtmlToElement('<div id="columns"></div>');
		console.log(rhit.productBucketManager.numberOfProducts);
		for (let i = 0; i < rhit.productBucketManager.numberOfProducts; i++) {
			const product = rhit.productBucketManager.getProductByIndex(i);
			const productCard = this.createProductCard(product);

			productCard.onclick = () => {
				window.location.href = `/cart.html?id=${product.id}`;
			}

			newProductList.appendChild(productCard);
		}
		const oldPhotoList = document.querySelector("#columns");
		oldPhotoList.removeAttribute("id");
		oldPhotoList.hidden = true;
		oldPhotoList.parentElement.appendChild(newProductList);
	}
	createProductCard(product) {
		return convertHtmlToElement(`<div class="pin" id="${product.id}">
        <img src="${product.photoUrl}" alt="${product.name}">
        <p class="caption">${product.name}</p>
      </div>`);
	}
}


// rhit.ProductPageController = class {
// 	constructor() {
// 		document.querySelector("#menuSignOut").addEventListener("click", () => {
// 			rhit.authManager.signOut();
// 		});

// 		document.querySelector("#submitEditCaption").addEventListener("click", () => {
// 			const caption = document.querySelector("#inputCaption").value;
// 			rhit.singlePhotoManager.updateCaption(caption);
// 		});

// 		$("#editPhotoDialog").on("show.bs.modal", () => {
// 			document.querySelector("#inputCaption").value = rhit.singlePhotoManager.caption;
// 		});
// 		$("#editPhotoDialog").on("shown.bs.modal", () => {
// 			document.querySelector("#inputCaption").focus();
// 		});

// 		document.querySelector("#submitDeletePhoto").addEventListener("click", () => {
// 			rhit.singlePhotoManager.deletePhoto().then(() => {
// 				console.log("Photo successfully deleted");
// 				window.location.href = "/mainpage.html";
// 			}).catch(error => {
// 				console.error("Error removing photo: ", error);
// 			});
// 		});

// 		rhit.singlePhotoManager.startListening(this.updatePhotoView.bind(this));
// 	}
// 	updatePhotoView() {
// 		document.querySelector("#photo").src = rhit.singlePhotoManager.imageURL;
// 		document.querySelector("#caption").textContent = rhit.singlePhotoManager.caption;
// 		if (rhit.singlePhotoManager.author === rhit.authManager.uid) {
// 			document.querySelector("#menuEdit").style.display = "flex";
// 			document.querySelector("#menuDelete").style.display = "flex";
// 		}
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
	if (document.querySelector("#loginPage")) {
		console.log("You are on the login page.");
		rhit.startFirebaseUI();
		new rhit.LoginPageController();
	}
	if (document.querySelector("#mainPage")) {
		console.log("You are on the main page.");
		const userId = rhit.authManager.uid;
		console.log(userId);
		rhit.productBucketManager = new rhit.ProductBucketManager(userId);
		new rhit.MainpageController();
	}
	if (document.querySelector("#cartPage")) {
		console.log("You are on the cart page.");
		const userId = rhit.authManager.uid;
		console.log(userId);
		rhit.productBucketManager = new rhit.ProductBucketManager(userId);
		rhit.cartManager = new rhit.CartManager(userId);
		// new rhit.CartpageController();
		// new rhit.ProductPageController();
	}
	if (document.querySelector("#profilePage")) {
		console.log("You are on the profile page.");
		new rhit.ProfilePageController();
	}

};


rhit.LoginPageController = class {
	constructor() {
		// rhit.authManager.startFirebaseAuthUi();
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

