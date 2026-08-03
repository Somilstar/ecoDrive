
  function configureAuthenticationLink() {
    const token = localStorage.getItem("token");

    if (!token) {
      authLink.textContent = "Login";
      authLink.href = "login.html";
      return;
    }

    authLink.textContent = "Logout";
    authLink.href = "#";

    authLink.addEventListener("click", (event) => {
      event.preventDefault();

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      window.location.href = "login.html";
    });
  }
function updateCartCount(){
    const cartCountElement = document.getElementById("cartCount");
    if(!cartCountElement){
        return;
    }
        const savedCart = localStorage.getItem("ecoDriveCart");
    if (!savedCart){
        cartCountElement.textContent = "0";
        return;
    }

    try {
        const cart = JSON.parse(savedCart);
       const count = cart.length;
       cartCountElement.textContent = count;
       if (count > 0){
         cartCountElement.style.display = "inline-flex";
       }
       else{
        cartCountElement.style.display = "none";
       }
    } catch (error){
        console.error("Could not load cart count:", error);
        cartCountElement.textContent = "0";
    }
}
document.addEventListener("DOMContentLoaded", () => {
    updateCartCount();
    configureAuthenticationLink()
    const userString = localStorage.getItem("user");
    if (!userString) {
        return;
    }

    const user = JSON.parse(userString);
    if (user.role !== 'admin') {
        return;
    }

    const navLinks = document.querySelector(".nav-links");
    if (!navLinks || navLinks.querySelector('a[href="admin.html"]')) {
        return;
    }

    const adminItem = document.createElement("li");
    adminItem.innerHTML = '<a href="admin.html">Admin</a>';

    const accountLink = navLinks.querySelector('a[href="account.html"]');
    if (accountLink) {
        accountLink.parentElement.insertAdjacentElement("afterend", adminItem);
    } else {
        navLinks.appendChild(adminItem);
    }
});
