let originalData = [];  // Barcha ma'lumotlarni saqlash uchun

const filterBtn = document.getElementById('filterBtn');
const loadingSpinner = document.getElementById('loadingSpinner');
const tableLoader = document.getElementById('tableLoader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const statsTable = document.getElementById('statsTable');

function setLoading(isLoading) {
  loadingSpinner.classList.toggle('hidden', !isLoading);
  tableLoader.classList.toggle('hidden', !isLoading);
  filterBtn.disabled = isLoading;
  statsTable.classList.toggle('hidden', isLoading);
}

function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, 5000);
}

// Ma'lumotlarni sanaga qarab filterlash
function filterDataByDate(data, startDate, endDate) {
  console.log(startDate, endDate);
  const startTimestamp = startDate ? new Date(new Date(startDate).setHours(0, 0, 1)).getTime() : 0;
  const endTimestamp = endDate ? new Date(new Date(endDate).setHours(0, 0, 0, 0)).getTime() + (24 * 60 * 60 * 1000 - 1) : Infinity;

  return data.map(categoryData =>
    categoryData.filter(item =>
      item.time >= startTimestamp && item.time <= endTimestamp
    )
  );
}

async function fetchData() {
  try {
    setLoading(true);
    errorMessage.classList.add('hidden');

    const statistic = new Statistics();
    originalData = await statistic.getStatisticsData();

    return originalData;
  } catch (error) {
    showError(error.message);
    return null;
  } finally {
    setLoading(false);
  }
}

function updateTable(data) {
  if (!data) {
    statsTable.innerHTML = `
                    <tr>
                        <td colspan="2" class="px-6 py-4 text-center text-gray-500">
                            Ma'lumotlar mavjud emas
                        </td>
                    </tr>
                `;
    return;
  }

  const [
    pageVisits,
    registrationClicks,
    dataSubmissions,
    completedRegistrations,
    telegramSubscriptions
  ] = data;

  const rows = [
    {name: 'Sahifaga kirganlar', value: pageVisits.length},
    {name: 'Ro\'yxatdan o\'tish tugmasini bosganlar', value: registrationClicks.length},
    {name: 'Ma\'lumotlarini yuborganlar', value: dataSubmissions.length},
    // {name: 'Ro\'yxatdan o\'tganlar', value: completedRegistrations.length},
    {name: 'Obuna bo\'lish tugmasini bosganlar', value: telegramSubscriptions.length}
  ];

  statsTable.innerHTML = rows.map(row => `
                <tr class="transition-colors">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${row.name}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">${row.value}</td>
                </tr>
            `).join('');
}

filterBtn.addEventListener('click', () => {
  const startDate = document.getElementById('startDate').value;
  const endDate = document.getElementById('endDate').value;

  if (!startDate || !endDate) {
    showError('Iltimos, boshlanish va tugash sanalarini tanlang');
    return;
  }

  if (new Date(startDate) > new Date(endDate)) {
    showError('Boshlanish sanasi tugash sanasidan katta bo\'lishi mumkin emas');
    return;
  }

  const filteredData = filterDataByDate(originalData, startDate, endDate);
  updateTable(filteredData);
});

// Sahifa yuklanganda boshlang'ich ma'lumotlarni olish
window.addEventListener('load', async () => {
  const data = await fetchData();
  if (data) {
    updateTable(data);
  }
});
