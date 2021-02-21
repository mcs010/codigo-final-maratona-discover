//Add or remove 'active' class in the selected document (DOM) elements
function Modal() {
    let status = document.querySelector('.modal-overlay').classList;
    status.toggle('active'); //Verify if the class already exists, if so, removes it, if not add it
}

const Storage = {
    get() {
        // Transforms the string back to array and gets it (if it's blank, gets a empty array)
        return JSON.parse(localStorage.getItem("dev.finances:transactions")) || []
    },

    set(transactions) {
        // Transforms the array into string and storages it at Local Storage with key : value binding
        localStorage.setItem("dev.finances:transactions", JSON.stringify(transactions))
    }
}

//Responsible for adding or removing transactions and doing the calculations
const Transaction = {
    all: Storage.get(),

    add(transactions) { // Responsible for adding all transactions 
        Transaction.all.push(transactions)

        App.reload() // Calls it for sending transactions to DOM
    },
    remove(index) {// Responsible for deleting a transaction
        Transaction.all.splice(index, 1) // Deletes 1 transaction in the specified index

        App.reload()
    },
    incomes() { // Sum of all incomes
        let income = 0
        Transaction.all.forEach(transactions => { //arrow function
            if (transactions.amount > 0) { // Verifies if each amount is positive
                income = income + transactions.amount; // Then adds it to the income variable
            }
        })
        return income
    },
    expenses() { //Sum of all expenses
        let expenses = 0
        Transaction.all.forEach(transactions => {
            if (transactions.amount < 0) {
                expenses += transactions.amount;
            }
        })
        return expenses
    },
    total() {// Incomes - expenses = total
        return Transaction.incomes() + Transaction.expenses()
    }
}

//Responsible for displaying data in the html
const DOM = {
    // Selects where to put the incomes and expenses
    transactionsContainer: document.querySelector('#data-table tbody'),

    // Receives each transaction (from the function inside transactions.forEach()) and sends it to the DOM
    addTransaction(transactions, index) {
        const tr = document.createElement('tr') // A tr tag is created in the tbody tag inside the #data-table
        tr.innerHTML = DOM.innerHTMLTransaction(transactions, index)// The just created tr receives the data from the parameter
        tr.datasetindex = index

        DOM.transactionsContainer.appendChild(tr)
    },

    // Gets the data of incomes and expenses from transactions and puts it in html structure
    innerHTMLTransaction(transactions, index) {
        const CSSclass = transactions.amount > 0 ? "income" : "expense" // Decides whether the html class is an income or expense by verifying its amount

        const amount = Utils.formatCurrency(transactions.amount) // Gets the formated amount

        // Structures de data from transaction into html
        const html = `
        <td class="description">${transactions.description}</td>
        <td class="${CSSclass}">${amount}</td>
        <td class="date">${transactions.date}</td>
        <td><img onclick="Transaction.remove(${index})" src="./assets/minus.svg" alt="Remover Transação"></td>
        `
        return html
    },

    // Displays the summaryzed balance
    updateBalance() {
        let totalColor
        // Change the img and text color of the Total Card according of its value 
        if (Transaction.total() > 0) {
            totalColor = '#49aa26' // background color green
            document.querySelector('.card.total img').classList.remove('filter-img')
            document.querySelector('.card.total h3').classList.remove('change-text')
            document.querySelector('.card.total p').classList.remove('change-text')
        } else {
            if (Transaction.total() == 0) {
                totalColor = 'white' // background color white
                document.querySelector('.card.total img').classList.add('filter-img')
                document.querySelector('.card.total h3').classList.add('change-text')
                document.querySelector('.card.total p').classList.add('change-text')
            } else {
                totalColor = '#e92929' // background color red
                document.querySelector('.card.total img').classList.remove('filter-img')
                document.querySelector('.card.total h3').classList.remove('change-text')
                document.querySelector('.card.total p').classList.remove('change-text')
            }
        }

        document
            .getElementById('incomeDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.incomes())
        document
            .getElementById('expenseDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.expenses())
        document
            .getElementById('totalDisplay')
            .innerHTML = Utils.formatCurrency(Transaction.total())
        document.querySelector('.card.total')
            .style.background = totalColor
    },

    // Cleans all transactions in the DOM
    clearTransactions() {
        DOM.transactionsContainer.innerHTML = ""
    }
}

// Responsible for formatting values
const Utils = {
    formatAmount(value) { // Formats values of incomes and expenses to number data type
        value = Number(value) * 100
        return Math.round(value)
    },

    formatDate(date) { // Formats dates
        const splittedDate = date.split("-")
        return `${splittedDate[2]}/${splittedDate[1]}/${splittedDate[0]}`
    },

    formatCurrency(value) { // Formats values to local currency
        const signal = Number(value) < 0 ? "-" : "" // Storages the signal of the number
        value = String(value).replace(/\D/g, "") // Removes special characters
        value = Number(value) / 100 // Divides by 100 to return to the normal value (all numers are multiplied by 100)

        // Changes local currency according to page language
        let lang = document.querySelector('html').getAttribute('lang')
        if (lang == 'en-us') {
            value = value.toLocaleString("en-us", { style: "currency", currency: "USD" })
        } else {
            value = value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
        }


        return signal + value
    }
}

const Form = { // Responsible for manipulating data in form
    description: document.querySelector('input#description'),
    amount: document.querySelector('input#amount'),
    date: document.querySelector('input#date'),

    getValues() { // Responsible for getting only the values of inputs from DOM
        return {
            description: Form.description.value,
            amount: Form.amount.value,
            date: Form.date.value,
        }
    },

    validateFields() { // Responsible for validating the form fields
        const { description, amount, date } = Form.getValues() // Dismember the values into each variable
        if (description.trim() === "" || amount.trim() === "" || date.trim() === "") {
            throw new Error("Por favor, preencha todos os campos")
        }
    },

    formatValues() { // Receives the formatted value from Utils
        let { description, amount, date } = Form.getValues() // Dismember the values into each variable

        amount = Utils.formatAmount(amount)
        date = Utils.formatDate(date)

        return {
            description,
            amount,
            date
        }
    },

    clearFields() { // Responsible for cleaning form after saving a transaction
        Form.description.value = ""
        Form.amount.value = ""
        Form.date.value = ""
    },

    submit(event) {
        event.preventDefault() // Calls it to prevent it from doing a default action

        try {
            //Form.validateFields() // Calls it to verify if all fields are filled

            const transaction = Form.formatValues() // Calls it to format values to save it

            Transaction.add(transaction) // Receives the formated values and saves it on Transaction then reloads the application

            Form.clearFields()// Erase data in the form

            Modal() // Close Modal

        } catch (error) {
            alert(error.message) // Pops up a message if a field is not filled
        }
    }
}

const App = {
    init() {// Responsible for starting the application
        // Pass through each income and expense and then sends it to addTransaction
        Transaction.all.forEach(DOM.addTransaction)

        // Calls it to udpate cards in the DOM
        DOM.updateBalance()

        //Updates the localStorage
        Storage.set(Transaction.all)
    },
    reload() { // Responsible for updating the application
        // Calls to clean all transactions in the DOM
        DOM.clearTransactions()
        //Call to resend all transactions to DOM
        App.init()
    },
}

App.init() //Starts application

