export const login = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgba(128, 128, 128, 0.2)', // Semi-transparent white
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    padding: '20px',
    width: '500px', // Maximum width of the form container
    height: '500px', // Maximum height of the form container
    margin: 'auto', // Helps center the div horizontally
    marginTop: '50px', // Adjust this value to center the div vertically as desired
    marginBottom: '50px', // Provides some space at the bottom
};

// Wrapper style for vertical centering
export const wrapperStyle = {
    display: 'flex',
    FlexDirection: 'column',
    minHeight: '100vh', // Ensures the wrapper takes full viewport height
    justifyContent: 'center', // Centers the child vertically
    alignItems: 'center', // Centers the child horizontally
};