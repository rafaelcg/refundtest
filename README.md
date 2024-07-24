# Refunds Data Application

This project is a simple web application that displays refund data from a CSV file.

## Steps Taken

1. **Project Setup**:

   - Initialized a new Node.js project using `npm init -y`.
   - Installed necessary dependencies: `express`, `csv-parser`, `moment-timezone`, and `nodemon`.

2. **CSV Data Handling**:

   - I've decided to assume this could eventually be a lambda function that reads from a CSV file. By assuming that I can more safely assume we're working with somewhat normalised data that I could then work with inside the function.
   - Used the `csv-parser` library to read and parse data from a CSV file (`refunds.csv`).
   - I've decided to use `moment-timezone` as it facilitates handling date conversion. `Day.js` would probably be a better option for a production app as it's smaller, but I have a bit more familiarity with Moment.
   - I basically turned everything into UTC. In an ideal world I'd read the CSV and add some of all of this info to my database as UTC, keeping a `Timezone` column for display purposes. This facilitates the data handling side which can be a pain.

3. **Refund Logic**:

   - Defined mappings for time zones and refund policies in `utils/mappings.js`. That's the minimum organisation I've added to the project. In a real scenario I'd separate concerns better but I focused on delivering the result.
   - Implemented functions to determine if a user is under the new Terms of Service (TOS) and to check if a refund is allowed based on the request type and TOS. Those could be incrementally improved but I'm satisfied with the results for the time I've had to spend on this.

4. **Frontend**:
   - Created a simple HTML page (`public/index.html`) to display the refund data in a table format.
   - Used vanilla JavaScript to fetch the refund data from the server and dynamically populate the table.
   - Added basic styling to differentiate between allowed and not allowed refunds.
   - Usually I love working on the Frontend but I figured this wasn't the focus of this exercise so I kept things simple.

## Logic Used

1. **Date and Time Conversion**:

   - The `convertToUTC` function converts local dates and times to UTC, taking into account the customer's time zone and request type.
   - For phone requests, additional logic ensures that requests are processed during business hours in the UK.

2. **Refund Eligibility**:

   - The `checkisUserNewTos` function checks if a user is under the new TOS based on their signup date.
   - The `checkRefundAllowed` function determines if a refund request is allowed by comparing the refund request date with the investment date plus the allowed refund period.

3. **Data Normalization**:
   - The CSV data is normalized into a consistent format before being sent to the frontend.
   - Each record includes the necessary data to display the end result. In a real world scenario this would be better filtered and sent to a database somewhere.
   - Goes without saying but I didn't focus on basic things an app needs like error logging, queues, databases, etc.

## How to Run

1. Clone the repository.
2. Install dependencies using `npm install`.
3. Start the server using `npm start`.
4. Open a web browser and navigate to `http://localhost:3000` to view the refund data.
