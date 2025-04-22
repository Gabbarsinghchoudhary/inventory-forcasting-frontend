import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { AlertTriangle, RefreshCw } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const Main = () => {
  // State management
  const [medicines, setMedicines] = useState([]);
  const [states, setStates] = useState([]);
  const [chartData, setChartData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [allForecasts, setAllForecasts] = useState({});
  const [stockWarnings, setStockWarnings] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMedicineForTable, setSelectedMedicineForTable] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [selectedState, setSelectedState] = useState('');

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
  
  
  const itemsPerPage = 10;

  // Initial data loading
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/medicines`)
      .then(res => setMedicines(res.data))
      .catch(err => console.error(err));

    axios.get(`${API_BASE_URL}/api/states`)
      .then(res => setStates(res.data))
      .catch(err => console.error(err));
      
    // Fetch all forecasts and stock warnings when component mounts
    fetchAllForecasts();
    fetchStockWarnings();
  }, []);

  // Date formatting helper function
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // If date is invalid, try parsing different formats
        // Assuming dateString might be in format "YYYY-MM-DD" or similar
        const parts = dateString.split(/[-\/]/);
        if (parts.length >= 3) {
          // Try different date part arrangements
          const potentialDate = new Date(
            parseInt(parts[0]), 
            parseInt(parts[1]) - 1, 
            parseInt(parts[2])
          );
          if (!isNaN(potentialDate.getTime())) {
            return potentialDate.toLocaleDateString('en-US', { 
              month: 'long', 
              year: 'numeric' 
            });
          }
        }
        return dateString; // Return original if parsing fails
      }
      
      return date.toLocaleDateString('en-US', { 
        day: 'numeric',
        month: 'long', 
        year: 'numeric' 
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return dateString; // Return original on error
    }
  };

  // Data fetching functions
  const fetchAllForecasts = () => {
    setIsLoading(true);
    axios.get(`${API_BASE_URL}/api/all_forecasts`)
      .then(res => {
        if (res.data && res.data.length > 0 && res.data[0].forecasts) {
          setAllForecasts(res.data[0].forecasts);
          
          // Set default selected medicine for table if available
          const medicineNames = Object.keys(res.data[0].forecasts);
          if (medicineNames.length > 0) {
            setSelectedMedicineForTable(medicineNames[0]);
          }
        }
      })
      .catch(err => console.error('Error fetching all forecasts:', err))
      .finally(() => setIsLoading(false));
  };

  const fetchStockWarnings = () => {
    axios.get(`${API_BASE_URL}/api/stock`)
      .then(res => {
        setStockWarnings(res.data);
      })
      .catch(err => console.error('Error fetching stock warnings:', err));
  };

  const fetchForecastData = () => {
    axios.get(`${API_BASE_URL}/api/forecast`)
      .then(res => {
        const data = res.data;
        const dates = Object.keys(data).map(date => date.split(' ')[0]);
        const values = Object.values(data);

        setChartData({
          labels: dates.map(formatDate),
          datasets: [
            {
              label: 'Medicine Usage',
              data: values,
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              borderColor: 'rgb(53, 162, 235)',
              borderWidth: 1,
            },
          ],
        });
      })
      .catch(err => console.error(err))
      .finally(() => setIsLoading(false));
  };

  // Event handlers
  const handleRefreshData = () => {
    setIsRefreshing(true);
    axios.get(`${API_BASE_URL}/api/all_forecast_post`)
      .then(res => {
        console.log('Forecast data refreshed:', res.data);
        // Refetch all data after refresh
        fetchAllForecasts();
        fetchStockWarnings();
      })
      .catch(err => console.error('Error refreshing forecast data:', err))
      .finally(() => setIsRefreshing(false));
  };

  const handleSubmit = () => {
    setIsLoading(true);
    const payload = {
      time: selectedTime,
      medicine: selectedMedicine,
      state: selectedState
    };

    axios.post(`${API_BASE_URL}/api/selection`, payload)
      .then(res => {
        console.log(res.data.message);
        fetchForecastData();
      })
      .catch(err => {
        console.error(err);
        setIsLoading(false);
      });
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Medicine Usage Forecast',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Amount',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  // Component rendering functions
  const renderStockWarnings = () => {
    if (!stockWarnings || Object.keys(stockWarnings).length === 0) {
      return null;
    }

    return (
      <div style={{ 
        marginBottom: '30px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffeeba',
        borderRadius: '4px',
        padding: '15px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '10px',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <AlertTriangle color="#856404" size={24} />
            <h3 style={{ margin: '0 0 0 10px', color: '#856404' }}>Stock Warnings</h3>
          </div>
          <button
            onClick={handleRefreshData}
            disabled={isRefreshing}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '8px 15px',
              backgroundColor: isRefreshing ? '#cccccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s'
            }}
          >
            <RefreshCw size={16} style={{ marginRight: '5px' }} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </button>
        </div>
        <div style={{ color: '#856404' }}>
          <ul style={{ paddingLeft: '25px', margin: '0' }}>
            {Object.entries(stockWarnings).map(([medicine, warning], index) => (
              <li key={index} style={{ marginBottom: '5px' }}>
                <strong>{medicine}:</strong> {warning}
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderForecastTable = () => {
    if (!allForecasts || !selectedMedicineForTable || !allForecasts[selectedMedicineForTable]) {
      return <p>No forecast data available</p>;
    }

    const medicineData = allForecasts[selectedMedicineForTable];
    const dates = Object.keys(medicineData);
    
    // Calculate pagination
    const totalPages = Math.ceil(dates.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedDates = dates.slice(startIndex, startIndex + itemsPerPage);

    return (
      <div>
        <div style={{ marginBottom: '15px' }}>
          <h3>Forecast Table</h3>
          <select 
            value={selectedMedicineForTable} 
            onChange={e => setSelectedMedicineForTable(e.target.value)}
            style={{
              padding: '8px',
              marginBottom: '10px',
              width: '200px',
              borderRadius: '4px',
              border: '1px solid #ddd'
            }}
          >
            {Object.keys(allForecasts).map((med, index) => (
              <option key={index} value={med}>{med}</option>
            ))}
          </select>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Date</th>
              <th style={{ border: '1px solid #ddd', padding: '8px', backgroundColor: '#f2f2f2' }}>Forecast Value</th>
            </tr>
          </thead>
          <tbody>
            {paginatedDates.map((date, index) => (
              <tr key={index}>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(date)}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{medicineData[date].toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination controls */}
        <div style={{ marginTop: '15px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
          <button 
            onClick={() => handlePageChange(1)} 
            disabled={currentPage === 1}
            style={{
              padding: '5px 10px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              backgroundColor: currentPage === 1 ? '#f2f2f2' : '#007bff',
              color: currentPage === 1 ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            First
          </button>
          <button 
            onClick={() => handlePageChange(currentPage - 1)} 
            disabled={currentPage === 1}
            style={{
              padding: '5px 10px',
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
              backgroundColor: currentPage === 1 ? '#f2f2f2' : '#007bff',
              color: currentPage === 1 ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Prev
          </button>
          <span style={{ padding: '5px 10px' }}>
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => handlePageChange(currentPage + 1)} 
            disabled={currentPage === totalPages}
            style={{
              padding: '5px 10px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              backgroundColor: currentPage === totalPages ? '#f2f2f2' : '#007bff',
              color: currentPage === totalPages ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Next
          </button>
          <button 
            onClick={() => handlePageChange(totalPages)} 
            disabled={currentPage === totalPages}
            style={{
              padding: '5px 10px',
              cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
              backgroundColor: currentPage === totalPages ? '#f2f2f2' : '#007bff',
              color: currentPage === totalPages ? '#666' : 'white',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Last
          </button>
        </div>
      </div>
    );
  };

  // CSS for loader
  const loaderStyles = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
  };

  const spinnerStyles = {
    width: '50px',
    height: '50px',
    border: '5px solid #f3f3f3',
    borderTop: '5px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  };

  // Add CSS animation for spinner
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {/* Selection Form - Controls in a row */}
      <div style={{ marginBottom: '30px' }}>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '20px' }}>
          Medicine Forecast Selection
        </h2>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'row', 
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '15px',
          marginBottom: '20px'
        }}>
          {/* Time Period Selection */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h3>Select Time Period</h3>
            <select 
              value={selectedTime} 
              onChange={e => setSelectedTime(e.target.value)}
              style={{
                padding: '8px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">--Choose Time Period--</option>
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          {/* Medicine Selection */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h3>Select a Medicine</h3>
            <select 
              value={selectedMedicine} 
              onChange={e => setSelectedMedicine(e.target.value)}
              style={{
                padding: '8px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">--Choose Medicine--</option>
              {medicines.map((med, index) => (
                <option key={index} value={med}>{med}</option>
              ))}
            </select>
          </div>

          {/* State Selection */}
          <div style={{ flex: '1', minWidth: '200px' }}>
            <h3>Select a State</h3>
            <select 
              value={selectedState} 
              onChange={e => setSelectedState(e.target.value)}
              style={{
                padding: '8px',
                width: '100%',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            >
              <option value="">--Select State--</option>
              {states.map((state, index) => (
                <option key={index} value={state}>{state}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center', marginTop: '15px' }}>
          <button 
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              padding: '10px 30px',
              backgroundColor: isLoading ? '#cccccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.3s',
              fontSize: '16px'
            }}
          >
            {isLoading ? 'Loading...' : 'Forecast Medication'}
          </button>
        </div>
      </div>

      {/* Chart Section */}
      <div style={{ marginTop: '30px' }}>
        {isLoading ? (
          <div style={loaderStyles}>
            <div style={spinnerStyles}></div>
          </div>
        ) : (
          chartData && <Bar options={chartOptions} data={chartData} />
        )}
      </div>
      
      {/* Forecast Table Section with Stock Warnings */}
      <div style={{ marginTop: '40px', marginBottom: '30px' }}>
        <h2 style={{ borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>Forecasts Notification</h2>
        
        {/* Stock Warnings Section */}
        {renderStockWarnings()}
        
        {isLoading ? (
          <div style={loaderStyles}>
            <div style={spinnerStyles}></div>
          </div>
        ) : (
          renderForecastTable()
        )}
      </div>
    </div>
  );
};

export default Main;
