import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface Commit {
  id: string;
  message: string;
  repository: string;
  date: string;
  author: string;
}

interface CommitChartProps {
  activity: Array<any>;
  contributions?: Record<string, number>;
  commits?: Commit[];
}

// Predefined time periods
const TIME_PERIODS = [
  { label: '7 Days', days: 7 },
  { label: '30 Days', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: '2 Years', days: 730 },
  { label: 'All Time', days: 3650 } // ~10 years max
];

// Custom tooltip for the chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 p-3 rounded-md shadow-md">
        <p className="font-medium text-slate-200">{label}</p>
        <p className="text-cyan-400 font-medium">
          {payload[0].value} {payload[0].value === 1 ? 'contribution' : 'contributions'}
        </p>
      </div>
    );
  }
  return null;
};

// Format date based on selected time period
const formatDate = (dateStr: string, periodDays: number) => {
  const date = new Date(dateStr);
  
  if (periodDays <= 90) {
    // For periods up to 3 months: "Jan 15"
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } else if (periodDays <= 365) {
    // For periods up to 1 year: "Jan" (just month)
    return date.toLocaleDateString('en-US', { month: 'short' });
  } else {
    // For periods over 1 year: "Jan '23"
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      year: '2-digit'
    });
  }
};

// Aggregates data for longer time periods
const aggregateData = (data: any[], periodDays: number) => {
  if (periodDays <= 90) {
    // For short periods, return daily data
    return data;
  }
  
  // For longer periods, aggregate by week or month
  const aggregated: Record<string, number> = {};
  
  data.forEach(item => {
    let key;
    const date = new Date(item.date);
    
    if (periodDays <= 180) {
      // For 6 months, aggregate by week
      const weekNum = Math.floor(date.getDate() / 7);
      key = `${date.toLocaleDateString('en-US', { month: 'short' })} W${weekNum + 1}`;
    } else {
      // For 1+ years, aggregate by month
      key = date.toLocaleDateString('en-US', { 
        month: 'short', 
        year: periodDays > 365 ? '2-digit' : undefined 
      });
    }
    
    aggregated[key] = (aggregated[key] || 0) + item.contributions;
  });
  
  return Object.entries(aggregated).map(([date, contributions]) => ({
    date,
    contributions
  }));
};

export function CommitChart({ activity, contributions, commits = [] }: CommitChartProps) {
  // Default to 30 days view
  const [selectedPeriod, setSelectedPeriod] = useState(1); // Index 1 = 30 Days
  const [showCommitTable, setShowCommitTable] = useState(false);
  
  // Table pagination
  const [currentPage, setCurrentPage] = useState(0);
  const commitsPerPage = 10;

  // Generate the full contribution data for the maximum timeframe
  const fullContributionData = useMemo(() => {
    // Maximum days to cover (based on the longest period)
    const maxDays = TIME_PERIODS[TIME_PERIODS.length - 1].days;
    
    // Generate all dates for the timeframe
    const allDates: Record<string, number> = {};
    for (let i = 0; i < maxDays; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (maxDays - 1) + i);
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      allDates[dateStr] = 0;
    }
    
    // If contributions data is provided directly, merge it with our dates
    if (contributions) {
      Object.entries(contributions).forEach(([date, count]) => {
        if (allDates[date] !== undefined) {
          allDates[date] = count;
        }
      });
    } else if (activity) {
      // Calculate from activity if contributions not provided
      const maxDaysAgo = new Date();
      maxDaysAgo.setDate(maxDaysAgo.getDate() - maxDays);
      
      // Count the contributions from push events
      const pushEvents = activity.filter(event => event.type === 'PushEvent');
      pushEvents.forEach(event => {
        const date = new Date(event.created_at);
        if (date >= maxDaysAgo) {
          const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
          if (allDates[dateStr] !== undefined) {
            allDates[dateStr] = (allDates[dateStr] || 0) + event.payload.size;
          }
        }
      });
    }
    
    // Convert to array format for the chart
    return Object.entries(allDates).map(([date, count]) => ({
      date,
      contributions: count,
      formattedDate: formatDate(date, TIME_PERIODS[selectedPeriod].days)
    }));
  }, [activity, contributions, selectedPeriod]);
  
  // Filter the data based on the selected time period
  const filteredContributionData = useMemo(() => {
    const days = TIME_PERIODS[selectedPeriod].days;
    const filteredData = fullContributionData.slice(-days); // Get the last X days
    
    // For longer periods, aggregate the data
    return aggregateData(filteredData, days);
  }, [fullContributionData, selectedPeriod]);

  // Get the commits for the selected time period
  const filteredCommits = useMemo(() => {
    if (!commits || commits.length === 0) return [];
    
    const days = TIME_PERIODS[selectedPeriod].days;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return commits.filter(commit => {
      const commitDate = new Date(commit.date);
      return commitDate >= cutoffDate;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [commits, selectedPeriod]);

  // Calculate pagination data for commits table
  const paginatedCommits = useMemo(() => {
    const startIndex = currentPage * commitsPerPage;
    return filteredCommits.slice(startIndex, startIndex + commitsPerPage);
  }, [filteredCommits, currentPage]);

  const totalPages = Math.ceil(filteredCommits.length / commitsPerPage);

  if (fullContributionData.length === 0) {
    return <div className="text-center text-slate-400">No contribution activity found</div>;
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-medium text-white">Contribution Graph</h2>
        
        {/* Time period selector - tabs style */}
        <div className="flex items-center space-x-1 bg-slate-700 rounded-md p-1 overflow-x-auto">
          {TIME_PERIODS.map((period, index) => (
            <button
              key={period.label}
              onClick={() => setSelectedPeriod(index)}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === index 
                  ? 'bg-cyan-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-600'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-slate-900 p-6 rounded-md border border-slate-800">
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={filteredContributionData} 
              margin={{ top: 20, right: 10, left: 10, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis 
                dataKey="date" 
                tick={{ fill: '#94a3b8', fontSize: 12 }} 
                tickMargin={10}
                // Show fewer ticks on smaller screens or for more data points
                interval={filteredContributionData.length > 20 ? Math.floor(filteredContributionData.length / 10) : 0} 
              />
              <YAxis 
                tick={{ fill: '#94a3b8', fontSize: 12 }}
                tickMargin={10}
                allowDecimals={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="contributions"
                stroke="#22d3ee"
                strokeWidth={2}
                dot={{ r: 3, fill: '#22d3ee', stroke: '#22d3ee' }}
                activeDot={{ r: 5, stroke: '#06b6d4', strokeWidth: 1 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-slate-400 text-sm">Total Contributions</p>
            <p className="text-xl font-bold text-white">
              {filteredContributionData.reduce((sum, item) => sum + item.contributions, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Average Per Day</p>
            <p className="text-xl font-bold text-white">
              {(filteredContributionData.reduce((sum, item) => sum + item.contributions, 0) / 
                (TIME_PERIODS[selectedPeriod].days / (selectedPeriod >= 3 ? 7 : 1))).toFixed(1)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Most Active Day</p>
            <p className="text-xl font-bold text-white">
              {filteredContributionData.reduce((max, item) => 
                item.contributions > max.contributions ? item : max, 
                { date: 'None', contributions: 0 }
              ).date}
            </p>
          </div>
        </div>
        
        {/* Toggle for commit details table */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setShowCommitTable(!showCommitTable)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-md text-white transition-colors"
          >
            {showCommitTable ? 'Hide' : 'Show'} Commit Details
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-5 w-5 transition-transform ${showCommitTable ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
        
        {/* Commit details table */}
        {showCommitTable && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-white mb-3">Recent Commits</h3>
            
            {paginatedCommits.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-700">
                    <thead className="bg-slate-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Repository</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Commit Message</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Author</th>
                      </tr>
                    </thead>
                    <tbody className="bg-slate-900 divide-y divide-slate-800">
                      {paginatedCommits.map((commit) => (
                        <tr key={commit.id} className="hover:bg-slate-800">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {new Date(commit.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-cyan-400">
                            {commit.repository}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-300">
                            <div className="max-w-md truncate">{commit.message}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                            {commit.author}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Pagination controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-sm text-slate-400">
                      Showing {currentPage * commitsPerPage + 1} to {Math.min((currentPage + 1) * commitsPerPage, filteredCommits.length)} of {filteredCommits.length} commits
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                        disabled={currentPage === 0}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === 0 
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        Previous
                      </button>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={currentPage === totalPages - 1}
                        className={`px-3 py-1 rounded-md text-sm ${
                          currentPage === totalPages - 1 
                            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                            : 'bg-slate-700 text-white hover:bg-slate-600'
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-slate-400 py-10">No commit details available for the selected time period</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}