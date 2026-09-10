import Link from "next/link";

export const metadata = { title: "Политика конфиденциальности — Shoppi" };

export default function PrivacyPage() {
  return (
    <main className="flex-1 px-6 md:px-10 py-16 md:py-20">
      <div className="max-w-[720px] mx-auto flex flex-col gap-10">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-stone">Shoppi</span>
          <h1 className="font-display text-3xl md:text-4xl mt-2 mb-3">
            Политика конфиденциальности
          </h1>
          <p className="text-stone text-sm">Действует с 10 сентября 2026 года.</p>
        </div>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Какие данные мы собираем</h2>
          <p className="text-stone text-sm leading-relaxed">
            При регистрации мы получаем email и пароль (пароль хранится не в
            виде текста, а как необратимый хеш — мы не можем его прочитать).
            Куратор дополнительно может указать имя, описание и ссылку на
            аватар. Бренд указывает артикулы или домен, по которым мы находим
            ссылки на его товары.
          </p>
          <p className="text-stone text-sm leading-relaxed">
            Когда кто-то переходит по ссылке куратора, мы записываем факт
            клика, время и категорию товара — это нужно для статистики
            куратора и бренда. Мы не храним IP-адрес и user-agent посетителя
            в открытом виде: вместо этого сохраняется необратимый хеш,
            построенный из них и секретной соли на нашей стороне. По этому
            хешу нельзя восстановить исходный IP-адрес — он используется
            только чтобы не засчитывать повторный клик одного и того же
            посетителя дважды в течение 30 минут.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Зачем нам эти данные</h2>
          <ul className="text-stone text-sm leading-relaxed flex flex-col gap-2 list-disc pl-5">
            <li>Чтобы вести ваш аккаунт и показывать вашу витрину или кабинет.</li>
            <li>Чтобы считать клики по ссылкам и показывать честную статистику.</li>
            <li>Чтобы отличать реальные переходы от ботов и повторных кликов.</li>
          </ul>
          <p className="text-stone text-sm leading-relaxed">
            Мы не используем эти данные для рекламы, не продаём и не передаём
            их третьим лицам.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Где хранятся данные</h2>
          <p className="text-stone text-sm leading-relaxed">
            Данные хранятся на сервере, который обслуживает Shoppi. Сейчас
            сервис работает в режиме раннего продукта: данные не передаются
            за пределы инфраструктуры, которую мы контролируем напрямую.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Ваши права</h2>
          <p className="text-stone text-sm leading-relaxed">
            Вы можете в любой момент запросить удаление аккаунта и связанных
            с ним данных. Для этого напишите нам — контакт ниже.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="font-display text-xl">Связаться с нами</h2>
          <p className="text-stone text-sm leading-relaxed">
            По вопросам обработки данных пишите на{" "}
            <a href="mailto:privacy@shoppi.ru" className="underline underline-offset-4">
              privacy@shoppi.ru
            </a>
            .
          </p>
        </section>

        <Link href="/" className="text-sm underline underline-offset-4 w-fit">
          На главную
        </Link>
      </div>
    </main>
  );
}
