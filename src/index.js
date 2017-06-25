require('./style.css');

let friends;
let saved = JSON.parse(localStorage.getItem('saved')) || []; // Получаем список сохраненных

function vkApi(method, options) {
    Object.assign(options, { v: '5.65' });

    return new Promise((resolve, reject) => {
        VK.api(method, options, data => {
            if (data.error) {
                reject(new Error(data.error.error_msg));
            } else {
                resolve(data.response);
            }
        });
    });
}
function vkInit() { // Инициализация приложения
    return new Promise((resolve, reject) => {
        VK.init({ apiId: 6084144 });
        VK.Auth.getLoginStatus(function(response) { // Проверка статуса
            if (response.session) {
                resolve();
            } else {
                VK.Auth.login(response => { // Логинимся
                    if (response.session) {
                        resolve();
                    } else {
                        reject(new Error('Не удалось авторизоваться'));
                    }
                }, 2);
            }
        });
    });
}
// Шаблон для рендера
const template = (item, del = false) => `
    <li draggable="true" data-id="${item.id}">
        <img class="photo" src="${item.photo_200 ? item.photo_200 :
          'https://vk.com/images/deactivated_200.png'}" alt="img">
        <p>${item.first_name} ${item.last_name}</p>
        <i class="btn ${del ? 'btn_delete' : 'btn_add'}">${del ? '-' : '+'}</i>
    </li>
`;
const render = () => { // Функция рендера списков
    document.querySelector('.list_left').innerHTML = friends
        .filter(item => !saved.includes(String(item.id)) && isMatching(item, document.querySelector('#left').value))
        .map(item => template(item))
        .join('');
    document.querySelector('.list_right').innerHTML = friends
        .filter(item => saved.includes(String(item.id)) && isMatching(item, document.querySelector('#right').value))
        .map(item => template(item, true))
        .join('');
}
const toRight = id => saved.push(id); // Добавить в правый список
const toLeft = id => saved = saved.filter(item => item !== id); // Удалить из правого списка
const isMatching = (item, value) => `${item.first_name} ${item.last_name}`.toLowerCase().includes(value.toLowerCase());

document.addEventListener('keyup', function(e) {
    ['left', 'right'].includes(e.target.id) && render();
});

document.addEventListener('dragstart', function (e) {
    e.dataTransfer.setData('text', e.target.closest('[data-id]').dataset.id)
});

document.addEventListener('dragover', function (e) {
    e.target.closest('.list') && e.preventDefault();
});

document.addEventListener('click', function (e) {
    if (e.target.classList.contains('btn')) {
        const id = e.target.closest('[data-id]').dataset.id;

        e.target.classList.contains('btn_delete') && toLeft(id);
        e.target.classList.contains('btn_add') && toRight(id);
        render();
    }
});

document.addEventListener('drop', function (e) {
    e.preventDefault();
    const id = e.dataTransfer.getData('text');
    const add = document.querySelector(`[data-id="${id}"] .btn`).classList.contains('btn_add');

    add && e.target.closest('.list').classList.contains('list_right') && toRight(id);
    !add && e.target.closest('.list').classList.contains('list_left') && toLeft(id);
    render();
});

document.querySelector('.save').addEventListener('click', function (e) {
    e.preventDefault();
    localStorage.setItem('saved', JSON.stringify(saved));
});

vkInit()
  .then(() => vkApi('friends.get', { fields: 'photo_200' }))
  .then(response => friends = response.items)
  .then(render)
