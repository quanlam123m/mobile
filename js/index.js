// Create or Open Database.
var db = window.openDatabase('FGW', '1.0', 'FGW', 20000);

// To detect whether users use mobile phones horizontally or vertically.
$(window).on('orientationchange', onOrientationChange);

function onOrientationChange(e) {
    if (e.orientation == 'portrait') {
        console.log('Portrait.');
    }
    else {
        console.log('Landscape.');
    }
}

// To detect whether users open applications on mobile phones or browsers.
if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry)/)) {
    $(document).on('deviceready', onDeviceReady);
}
else {
    onDeviceReady();
}

// Display errors when executing SQL queries.
function transactionError(tx, error) {
    console.log(`[${new Date().toUTCString()}] Errors when executing SQL query. [Code: ${error.code}] [Message: ${error.message}]`);
}

// Run this function after starting the application.
function onDeviceReady() {
    // Logging.
    console.log(`[${new Date().toUTCString()}] Device is ready.`);

    db.transaction(function (tx) {
        // Create a query.
        var query = `CREATE TABLE IF NOT EXISTS Apartment (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                         Name TEXT NOT NULL UNIQUE,
                                                         Address TEXT NOT NULL,
                                                         Type TEXT NOT NULL,
                                                         Bedroom TEXT NOT NULL,
                                                         Furniture TEXT NOT NULL,
                                                         Price TEXT NOT NULL,
                                                         Reporter TEXT NOT NULL,
                                                         Datetime Date NOT NULL,
                                                         Note TEXT NOT NULL)`;

        // Execute a query.
        tx.executeSql(query, [], transactionSuccess_Apartment, transactionError);

        function transactionSuccess_Apartment(tx, result) {
            // Logging.
            console.log(`[${new Date().toUTCString()}] Create table 'Apartment' successfully.`);
        }

        var query = `CREATE TABLE IF NOT EXISTS Comment (Id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                        ApartmentID INTERGER NOT NULL,
                                                        Comment TEXT NOT NULL,
                                                        Datetime Date NOT NULL,
                                                        FOREIGN KEY (ApartmentID) REFERENCES Apartment(Id))`;

        // Execute a query.
        tx.executeSql(query, [], transactionSuccess_Comment, transactionError);

        function transactionSuccess_Comment(tx, result) {
        // Logging.
        console.log(`[${new Date().toUTCString()}] Create table 'Comment' successfully.`);
        }
    });
    prepareDatabase(db);
}

// Submit a form to register a new apartment.
$(document).on('submit', '#frm-submit', confirmProperty);
$(document).on('submit', '#confirmAdd', submitProperty);

function confirmProperty(e) {
    e.preventDefault();
    var property = $('#property').val();

    checkApartment(property);
}

function checkApartment(property) {
    db.transaction(function (tx) {
        var query = 'SELECT * FROM Apartment WHERE Name = ?';
        tx.executeSql(query, [property], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            if (result.rows[0] == null) {
                var address = $('#address').val();
                var type = $('#type').val();
                var bedroom = $('#bedroom').val();
                var furniture = $('#furniture').val();
                var price = $('#price').val();
                var reporter = $('#report').val();
                var note = $('#note').val();

                $("#confirmAdd #property").text(property);
                $("#confirmAdd #address").text(address);
                $("#confirmAdd #type").text(type);
                $("#confirmAdd #bedroom").text(bedroom);
                $("#confirmAdd #furniture").text(furniture);
                $("#confirmAdd #price").text(price);
                $("#confirmAdd #report").text(reporter);
                $("#confirmAdd #note").text(note);

                $("#confirmAdd").popup("open");
            }
            else {
                alert("Property type already exist")
            }
        }
    });
}

function submitProperty(e) {
    e.preventDefault();

    // Get user's input.
    var property = $('#property').val();
    var address = $('#address').val();
    var type = $('#type').val();
    var bedroom = $('#bedroom').val();
    var furniture = $('#furniture').val();
    var price = $('#price').val();
    var reporter = $('#report').val();
    var note = $('#note').val();
    var date = new Date()
        db.transaction(function (tx) {
            var query = 'INSERT INTO Apartment (Name, Address, Type, Bedroom, Furniture, Price, Reporter, Datetime, Note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
            tx.executeSql(query, [property, address, type, bedroom, furniture, price, reporter, date, note], transactionSuccess, transactionError);

            function transactionSuccess(tx, result) {
                // Logging.
                console.log(`[${new Date().toUTCString()}] Create a Property '${property}' successfully.`);

                // Reset the form.
                $('#frm-submit').trigger('reset');
                $("#confirmAdd").popup("close");
                $('#property').focus();
            }
        });
}

// Display Apartment List on page 3
$(document).on('pagebeforeshow', '#page-03', showList);

function showList() {
    db.transaction(function(tx){
        var query = 'SELECT * FROM Apartment';
        tx.executeSql(query, [], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Get list of apartment sucessfully`);

            // Prepare the list of apartments
            var list = `<ul id='list-apartment' data-role='listview' data-filter-placeholder='Search accounts...'
                        data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for(let apartment of result.rows) {
                list += `<li>
                            <a data-details='{"ID": ${apartment.Id}}'>
                                <img style="padding-top: 50px; padding-left: 15px; width: 100%" src='img/tuna.jpg'/>
                                <p>${apartment.Datetime}</p>
                                <div class="content">
                                    <h3>Property Name: ${apartment.Name}</h3>
                                    <h3>Address: ${apartment.Address}</h3>
                                    <div id="apartment">
                                        <div>
                                            <h3>Property Type: ${apartment.Type}</h3>
                                            <h3>Bedroom: ${apartment.Bedroom}</h3>
                                            <h3>Furniture: ${apartment.Furniture}</h3>
                                        </div>
                                        <div class="price">
                                            <h3>Price: ${apartment.Price}</h3>
                                            <h3>Reporter: ${apartment.Reporter}</h3>
                                        </div>
                                    </div>
                                </div>
                                
                            </a>
                        </li>`
            }
            list += `</ul>`

            // Add list to UI
            $('#list-apartment').empty().append(list).listview('refresh').trigger('create');
            console.log(`Show list of accounts successfully.`);
        }
    })
}

// Save Apartment ID 
$(document).on('vclick', '#list-apartment li a', function(e) {
    e.preventDefault();

    var id = $(this).data('details').ID;
    localStorage.setItem('currentApartmentId', id);

    $.mobile.navigate('#page-05', {transition: 'none'});
});

// Show Apartment Detail
$(document).on('pagebeforeshow', '#page-05', showDetail);

function showDetail() {
    var id = localStorage.getItem('currentApartmentId');

    db.transaction(function(tx) {
        var query ='SELECT * FROM Apartment WHERE Id = ?';
        tx.executeSql(query,[id], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            var errorMessage = 'Apartment not found';
            var property = errorMessage;
            var address = errorMessage;
            var type = errorMessage;
            var bedroom = errorMessage;
            var furniture = errorMessage;
            var price = errorMessage;
            var reporter = errorMessage;
            var note = errorMessage;

            if(result.rows[0] != null) {
                console.log(`Get details of apartment '${id}' successfully`);
                property = result.rows[0].Name;
                address = result.rows[0].Address;
                type = result.rows[0].Type;
                bedroom = result.rows[0].Bedroom;
                furniture = result.rows[0].Furniture;
                price = result.rows[0].Price;
                reporter = result.rows[0].Reporter;
                note = result.rows[0].Note;
            }
            else {
                console.log(errorMessage, 'ERROR');
            }
            $('#page-05 #id').text(id);
            $('#page-05 #property').text(property);
            $('#page-05 #address').text(address);
            $('#page-05 #type').text(type);
            $('#page-05 #bedroom').text(bedroom);
            $('#page-05 #furniture').text(furniture);
            $('#page-05 #price').text(price);
            $('#page-05 #report').text(reporter);
            $('#page-05 #note').text(note);
        }
    })
    showComment();
}

// Delete Apartment 
$(document).on('vclick', '#page-05 #frm-delete #btn-delete', deleteApartment)

function deleteApartment() {
    var id = localStorage.getItem('currentApartmentId');

    db.transaction(function(tx) {
        var query = 'DELETE FROM Apartment WHERE Id = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Successfull delete apartment '${id}'.`);

            $.mobile.navigate('#page-03');
        }
    })
}

// Add Comment
$(document).on('vclick', '#page-05 #btn-comment', addComment)

function addComment() {
    var id = localStorage.getItem('currentApartmentId');
    var comment = $('#page-05 #comment').val();
    var date = new Date()
    db.transaction(function(tx) {
        var query = 'INSERT INTO Comment(ApartmentID, Comment, Datetime) VALUES(? ,?, ?)';
        tx.executeSql(query, [id, comment, date], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Successfull add comment to apartment '${id}'.`);

            $('#page-05 #comment').val("");

            showComment()
        }
    })
}

// Show Comment
function showComment() {
    var id = localStorage.getItem('currentApartmentId')
    db.transaction(function(tx){
        var query = 'SELECT * FROM Comment WHERE ApartmentID = ?';
        tx.executeSql(query, [id], transactionSuccess, transactionError);

        function transactionSuccess(tx, result) {
            console.log(`Get list of comment sucessfully`);

            // Prepare the list of comment
            var listComment = `<ul id='list-comment' data-role='listview' data-filter-placeholder='Search accounts...'
                        data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for(let comment of result.rows) {
                listComment += `<li>
                                    <p>${comment.Datetime}</p>
                                    <p>${comment.Comment}</p>
                                </li>`
            }
            listComment += `</ul>`

            // Add list to UI
            $('#list-comment').empty().append(listComment).listview('refresh').trigger('create');
            console.log(`Show list of comment successfully.`);
        }
    })
}

// Search
$(document).on('submit', '#page-04 #search', search)

function search(e) {
    e.preventDefault()
    var name = $('#page-04 #search #property').val()
    var address = $('#page-04 #search #address').val()
    var type = $('#page-04 #search #type').val()
    var bedroom = $('#page-04 #search #bedroom').val()
    var furniture = $('#page-04 #search #furniture').val()
    var price = $('#page-04 #search #price').val()

    db.transaction(function(tx) {
        var query = `SELECT * FROM Apartment Where`;

        if(name) {
            query += ` Name Like "%${name}%"   AND`;
        }
        if(address) {
            query += ` Address Like "%${address}%"   AND`;
        }
        if(type) {
            query += ` Type = "${type}"   AND`;
        }
        if(bedroom) {
            query += ` Bedroom = "${bedroom}"   AND`;
        }
        if(furniture) {
            query += ` Furniture = "${furniture}"   AND`;
        }
        if(price) {
            query += ` Price Like "%${price}%"   AND`;
        }

        query = query.substring(0, query.length - 6);
        
        tx.executeSql(query, [], transactionSuccess, transactionError)

        function transactionSuccess(tx, result) {
            console.log(`Get list of apartment sucessfully`);

            // Prepare the list of apartments
            var list = `<ul id='list-apartment' data-role='listview' data-filter-placeholder='Search accounts...'
                        data-corners='false' class='ui-nodisc-icon ui-alt-icon'>`;
            for(let apartment of result.rows) {
                list += `<li>
                            <a data-details='{"ID": ${apartment.Id}}'>
                                <img style="padding-top: 50px; padding-left: 15px; width: 100%" src='img/tuna.jpg'/>
                                <div class="content">
                                    <h3>Property Name: ${apartment.Name}</h3>
                                    <h3>Address: ${apartment.Address}</h3>
                                    <div id="apartment">
                                        <div>
                                            <h3>Property Type: ${apartment.Type}</h3>
                                            <h3>Bedroom: ${apartment.Bedroom}</h3>
                                            <h3>Furniture: ${apartment.Furniture}</h3>
                                        </div>
                                        <div class="price">
                                            <h3>Price: ${apartment.Price}</h3>
                                            <h3>Reporter: ${apartment.Reporter}</h3>
                                        </div>
                                    </div>
                                </div>
                                
                            </a>
                        </li>`
            }
            list += `</ul>`

            // Add list to UI
            $('#list-search').empty().append(list).listview('refresh').trigger('create');

            console.log(`Show list apartment from search successfully`);
        }
    })
}

