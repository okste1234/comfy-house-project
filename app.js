const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
    space: "px6obivu9urq",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
    accessToken: "w29Fr_eFXK5YY3vLHPUMxHriM5jcn373G8o_PfUNbF0"
});
//console.log(client);

// variables
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart
let cart = [];
//buttons
let buttonsDOM = [];

// products
class Products {
    async getProducts() {
        try {
            let contentful = await client.getEntries({
                content_type: 'comfyHouseProducts'
            });
            console.log(contentful);

            // let result = await fetch("products.json");
            // let data = await result.json();

            
            // let products = data.items; //form an array(see prodect.json)
            let products = contentful.items;
            products = products.map(item => {
                const {title, price} = item.fields;
                const {id} = item.sys;
                const image = item.fields.image.fields.file.url;
                return {title, price, id, image};
            });
        // console.log(products);
            return products;
        } catch (error) {
        console.log(error);
        }
    }
}

//display _ ui
class UI {
    displayProducts(products) {
        let result = "";
        products.forEach(product => {//array method because we're getting back an array
            result += `
                <!-- single product -->
                <article class="product">
                <div class="img-container">
                    <img src=${product.image}
                    alt="product"
                    class="product-img">
                    <button class="bag-btn" 
                    data-id=${product.id}>
                        <i class="fa fa-shopping-cart"></i>
                        add to bag
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price} </h4>
            </article>
            <!-- single product end -->
            `;
        });
        productsDOM.innerHTML = result;
    }

    getBagButtons() {
        const buttons = [...document.querySelectorAll(".bag-btn")];
        buttonsDOM = buttons;
        buttons.forEach(button => {
            let id = button.dataset.id;
            //console.log(id);
            let inCart = cart.find(item => item.id === id);
            if (inCart) {
                button.innerText = "In Bag";
                button.disabled = true;
            }
            button.addEventListener("click", event => {
                // disable button
                event.target.innerText = "In Bag";
                event.target.disabled = true;
                // get product from products
                let cartItem = { ...Storage.getProduct(id), amount: 1 };
                //console.log(cartItem);
                // add product to the cart
                cart = [...cart, cartItem];
                //save cart in local storage so that data will be kept after loading
                Storage.saveCart(cart);
                // set cart values
                this.setCartValues(cart);
                // display cart item
                this.addToCart(cartItem);
                //show bag or cart items with overlay
                this.showCart();
            });           
        });
    }
    setCartValues(cart) {
        let tempTotal = 0;
        let itemsTotal = 0;
        cart.map(item => {
            tempTotal += item.price * item.amount;
            itemsTotal += item.amount;
        });
        cartTotal.innerText = parseFloat(tempTotal.toFixed(2));
        cartItems.innerText = itemsTotal;
    
    }
    addToCart(item) {
        const div = document.createElement("div")
        div.classList.add("cart-item")
        div.innerHTML = `<img src=${item.image}
        alt="product">
        <div>
            <h4>${item.title}</h4>
            <h5>$${item.price}</h5>
            <span class="remove-item" data-id = ${item.id}>remove</span>
        </div>
        <div>
            <i class="fa fa-chevron-up" data-id = ${item.id}></i>
            <p class="item-amount">${item.amount}</p>
            <i class="fa fa-chevron-down" data-id = ${item.id}></i>
        </div>`
        cartContent.appendChild(div)
    }
    
    showCart() {
        cartOverlay.classList.add("transparentBcg");
        cartDOM.classList.add("showCart");
    }
    setupAPP() {
        cart = Storage.getCart();
        this.setCartValues(cart);
        this.populateCart(cart);
        cartBtn.addEventListener("click", this.showCart);
        closeCartBtn.addEventListener("click", this.hideCart);
    }
    populateCart(cart) {
        cart.forEach(item => this.addToCart(item));
    }
    hideCart() {
        cartOverlay.classList.remove("transparentBcg");
        cartDOM.classList.remove("showCart");
    }
    
    cartLogic() {
        clearCartBtn.addEventListener("click", () => {
            this.clearCart();
        });

        cartContent.addEventListener("click", event => {
            if (event.target.classList.contains("remove-item")) {
                let removeItem = event.target;
                let id = removeItem.dataset.id;
                cartContent.removeChild(removeItem.parentElement.parentElement)
                this.removeFromBag(id)
            } else if (event.target.classList.contains("fa-chevron-up")) {
                let addUp = event.target;
                let id = addUp.dataset.id;
                let itemsTotal = cart.find(item => item.id === id);
                itemsTotal.amount = itemsTotal.amount + 1;
                Storage.saveCart(cart);
                this.setCartValues(cart);
                addUp.nextElementSibling.innerText = itemsTotal.amount
            } else if (event.target.classList.contains("fa-chevron-down")) {
                let subtract = event.target;
                let id = subtract.dataset.id;
                let itemsTotal = cart.find(item => item.id === id);
                itemsTotal.amount = itemsTotal.amount - 1;
                if (itemsTotal.amount >0) {
                    Storage.saveCart(cart);
                    this.setCartValues(cart);
                    subtract.previousElementSibling.innerText = itemsTotal.amount
                } else {
                    cartContent.removeChild(subtract.parentElement.parentElement)
                    this.removeFromBag(id)
                }
            }
        })
    }
    clearCart() {
        let cartItems = cart.map(item => item.id);
        cartItems.forEach(id => this.removeFromBag(id));

        while (cartContent.children.length > 0) {
            cartContent.removeChild(cartContent.children[0])
        }this.hideCart 
    };
    removeFromBag(id) {
        cart = cart.filter(item => item.id !== id);
        this.setCartValues(cart);
        Storage.saveCart(cart);
        let button = this.getAButton(id);
        button.disabled = false;
        button.innerHTML = `
        <i class ="fa fa-shopping-cart">
        </i>add to bag`;
    };
    getAButton(id) {
        return buttonsDOM.find(button => button.dataset.id === id);
    }



}



// local storage
class Storage {
    static saveProducts(products) {
        localStorage.setItem("products", JSON.stringify(products));
    }
    static getProduct(id) {
        let products = JSON.parse(localStorage.getItem("products"));
    return products.find(product => product.id === id);
    }
    static saveCart(cart) {
        localStorage.setItem("cart", JSON.stringify(cart));
    }
    static getCart() {
        return localStorage.getItem("cart") ? JSON.parse(localStorage.getItem("cart")): [];
    }
}


document.addEventListener("DOMContentLoaded", () => {
    const ui = new UI();
    const products = new Products();

    //app setup
    ui.setupAPP();

    // get all products
    products.getProducts()
    .then(products => {
        ui.displayProducts(products);
        Storage.saveProducts(products);//static method
    })
    .then(() => {
        ui.getBagButtons();
        ui.cartLogic();
    });
});
