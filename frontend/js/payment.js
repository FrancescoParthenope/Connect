import { API_URL } from "../app.js";

let goTo;

export function init(page, navigateTo) {

    if (navigateTo) {
        goTo = navigateTo;
    }

    if (page === "insert_payments") {
        const paymentsForm = document.getElementById("PaymentsForm");

        if (paymentsForm) {
            paymentsForm.addEventListener(
                "submit",
                handleAddPaymentsMethod
            );
        }
    }
}

async function handleAddPaymentsMethod(event) {

    event.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
        alert("You must be logged in to add a payment method");
        if (goTo) {
            goTo("login");
        }
        return;
    }

    const paymentType = document.getElementById("paymentType").value;
    const cardNumber = document.getElementById("cardNumber").value.trim();
    const cvv = document.getElementById("cvv").value.trim();
    const expirationDate = document.getElementById("expirationDate").value.trim();
    const provider = document.getElementById("provider").value.trim();
    const is_default = document.getElementById("is_default").checked;

    try {
        const response = await fetch(`${API_URL}/payments_methods`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify({
                payment_type: paymentType,
                card_number: cardNumber,
                cvv: cvv,
                expiration_date: expirationDate,
                provider: provider,
                is_default: is_default
            })

        });

        const data = await response.json();

        if (response.ok) {
            if (data.success) {
                alert(data.message || "Payment method added successfully");
                document.getElementById("PaymentsForm").reset();
            } else {
                alert(`${data.message}, error code: ${response.status}`);
            }
        } else {
            alert(`Payment method failed with status ${response.status}`);
        }

    } catch (error) {
        console.error("Connection error:", error);
        alert("Impossible to connect to server");
    }
}

