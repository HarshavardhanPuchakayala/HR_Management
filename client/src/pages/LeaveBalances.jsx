import { useEffect, useState } from "react";
import { getMyLeaveBalances } from "../api/leaveBalances.js";

const LEAVE_TYPES = [
  "sick",
  "casual",
  "vacation",
  "other",
];

const LeaveBalances = () => {
  const currentYear = new Date().getFullYear();

  const [year, setYear] = useState(currentYear);
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadBalances = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getMyLeaveBalances(year);

        setBalances(data);
      } catch (error) {
        setError(
          error.response?.data?.message ||
            "Failed to load leave balances"
        );
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [year]);

  return (
    <div>
      <h1>Leave Balances</h1>

      <div>
        <label htmlFor="balance-year">
          Leave Year
        </label>

        <select
          id="balance-year"
          value={year}
          onChange={(event) =>
            setYear(Number(event.target.value))
          }
        >
          {[currentYear - 1, currentYear, currentYear + 1].map(
            (optionYear) => (
              <option
                key={optionYear}
                value={optionYear}
              >
                {optionYear}
              </option>
            )
          )}
        </select>
      </div>

      {loading && (
        <p>Loading leave balances...</p>
      )}

      {error && <p>{error}</p>}

      {!loading &&
        !error &&
        balances.length === 0 && (
          <p>
            No leave balances have been initialized
            for {year}.
          </p>
        )}

      {!loading &&
        !error &&
        balances.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Leave Type</th>
                <th>Allotted</th>
                <th>Carried Over</th>
                <th>Used</th>
                <th>Available</th>
              </tr>
            </thead>

            <tbody>
              {LEAVE_TYPES.map((leaveType) => {
                const balance = balances.find(
                  (item) =>
                    item.leaveType === leaveType
                );

                if (!balance) {
                  return (
                    <tr key={leaveType}>
                      <td>{leaveType}</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                      <td>—</td>
                    </tr>
                  );
                }

                const available =
                  balance.totalAllotted +
                  balance.carriedOver -
                  balance.used;

                return (
                  <tr key={balance._id}>
                    <td>{balance.leaveType}</td>
                    <td>{balance.totalAllotted}</td>
                    <td>{balance.carriedOver}</td>
                    <td>{balance.used}</td>
                    <td>{available}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
    </div>
  );
};

export default LeaveBalances;