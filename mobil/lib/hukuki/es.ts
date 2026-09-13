import type { HukukiMetin } from './tur'

// Ispanyolca ceviri. Kaynak: tr.ts - Turkce metin esastir.
const es: HukukiMetin = {
  gizlilik: [
    {
      baslik: 'Responsable del tratamiento',
      paragraflar: [
        'El responsable del tratamiento de los datos de esta app es Orçun Özdemir, como persona física. Puedes enviar tus solicitudes en el marco de la Ley turca de Protección de Datos Personales (KVKK) a destek@slooin.com; tu solicitud se responde en un plazo máximo de 30 días.',
      ],
    },
    {
      baslik: '1. Qué datos tuyos tratamos',
      paragraflar: [
        'Tu dirección de correo electrónico: hoy es el identificador PRINCIPAL de tu cuenta. Se usa al registrarte e iniciar sesión, y el código de verificación se envía ahí.',
        'Tu nombre, nombre de usuario, fecha de nacimiento, biografía y fotos de perfil.',
        'Tu ubicación, de tres maneras distintas: al buscar un lugar y al añadir un lugar, la ubicación del dispositivo se envía al servidor pero no se guarda; mientras un check-in está activo se guardan tus coordenadas; cuando el check-in se convierte en recuerdo (tras 1 hora o en cuanto pulsas "Me fui") las coordenadas se borran y solo queda en qué lugar estuviste (detalles abajo, en el apartado 3).',
        'El contenido de los mensajes que envías y recibes.',
        'Tus datos de amistad: a quién sigues, con quién has intercambiado solicitudes de chat, a quién has bloqueado.',
        'El token de notificaciones de tu dispositivo, para que podamos enviarte notificaciones.',
        'Las denuncias que has presentado o las presentadas sobre ti.',
        'Las valoraciones que das a los lugares (Malo / Bueno / Genial). Todos ven solo los totales; qué valoración diste solo lo ves tú. Tus fotos de check-in también aparecen en el área de fotos de ese lugar, con la regla de visibilidad que elegiste.',
      ],
    },
    {
      baslik: '2. Con qué finalidad y con qué base legal',
      paragraflar: [
        'El artículo 10 de la KVKK exige indicar la base legal junto con la finalidad del tratamiento. La base de cada finalidad se indica por separado.',
        'Crear tu cuenta y verificar tu correo electrónico. Base legal: ejecución de un contrato (KVKK art. 5/2-c); sin cuenta no funciona ninguna función de la app.',
        'Permitirte descubrir lugares y personas cerca de ti (ubicación y check-in). Base legal: ejecución de un contrato (KVKK art. 5/2-c). Lo único que hace Slooin es que hagas check-in en un lugar y veas quién está allí; sin tratar la ubicación la app no funciona, así que la ubicación no es una "función extra" sino el servicio en sí.',
        'Permitirte enviar mensajes. Base legal: ejecución de un contrato (KVKK art. 5/2-c).',
        'Prevenir e investigar el uso indebido (acoso, cuentas falsas, contenido inapropiado): registros de denuncias, registro de auditoría de moderación, registros de estado de cuenta y contadores de límite de solicitudes. Base legal: interés legítimo (KVKK art. 5/2-f): poder proteger a los usuarios del acoso y del uso indebido.',
        'El consentimiento que das al pulsar "Continuar" al crear tu cuenta se guarda en la base de datos como prueba: que leíste el aviso de privacidad y aceptaste el tratamiento de tu ubicación, junto con la versión del texto y el momento del consentimiento (dos registros: aydinlatma y konum_rizasi). Este registro no sustituye a las bases legales anteriores; se guarda además de ellas para poder mostrar retrospectivamente qué se te informó.',
      ],
    },
    {
      baslik: '3. La ubicación en particular',
      paragraflar: [
        'La ubicación de tu dispositivo se usa de TRES maneras distintas; es importante no confundirlas.',
        'Al buscar lugares: para mostrarte los lugares cercanos, la ubicación de tu dispositivo se ENVÍA al servidor en cada búsqueda. Esta ubicación NO SE GUARDA: solo se usa para responder esa consulta y no se escribe en ningún sitio de la base de datos.',
        'Al añadir un lugar nuevo: para comprobar que realmente estás cerca del lugar que quieres añadir, se envía la ubicación de tu dispositivo (debes estar a menos de ~200 metros). Esta ubicación TAMPOCO SE GUARDA: solo sirve para esta comprobación de cercanía. Lo único que se guarda es la ubicación del lugar añadido, no la tuya en ese momento.',
        'Al hacer check-in: mientras el check-in está ACTIVO se guardan tus coordenadas. Pero es temporal: el check-in se convierte automáticamente en recuerdo tras 1 HORA (o en cuanto pulsas "Me fui"), y en esa transición las coordenadas se BORRAN (se ponen a null en la base de datos); solo queda en qué lugar estuviste, no las coordenadas exactas. Como la limpieza se ejecuta cada 10 minutos, las coordenadas se conservan como máximo alrededor de 1 hora y 10 minutos.',
        'Las coordenadas guardadas mientras el check-in está activo se comparten según el nivel de presencia que elegiste para el check-in (esto es para el check-in EN VIVO): Público: NO todo el mundo en la app, solo quienes tengan un check-in en vivo en el mismo lugar en ese momento o tus seguimientos mutuos. Solo seguidores: solo tus seguimientos mutuos. Oculto: nadie lo ve; el check-in queda solo en tu propio historial.',
        'Una vez que el check-in se convierte en recuerdo (tras borrarse la ubicación), la visibilidad del recuerdo es un ajuste de tres niveles SEPARADO y sin la condición de "estar en vivo en el mismo lugar": Público: lo ve todo el mundo en la app (cuentas activas, excepto bloqueos). Solo seguidores: solo tus seguimientos mutuos. Nadie: solo tú, en tu propio perfil.',
        'Si eliges Oculto, nadie ve tu identidad, salvo la moderación. Pero hay una excepción: se te incluye en el contador público de "cuántas personas hay" (afluencia) del lugar donde estás, INDEPENDIENTEMENTE de tu nivel de presencia. Es decir, tu identidad se mantiene oculta, pero el contador sube con tu presencia: en un lugar tranquilo, cuando el contador pasa de 0 a 1, alguien allí puede deducir que "hay alguien".',
      ],
    },
    {
      baslik: '4. Acceso de la moderación',
      paragraflar: [
        'Cuando recibes una denuncia o se te revisa por sospecha de uso indebido, nuestro equipo de moderación puede leer tu perfil, tus check-ins y el contenido de tus mensajes. Esto se aplica aunque tu nivel de presencia sea oculto.',
        'Cada acceso de la moderación queda registrado: quién, cuándo y qué registro tuyo miró se guarda en un registro de auditoría. Este registro SOLO admite ADICIONES: el registro se crea en el servidor y no hay ninguna vía para que un moderador borre o modifique su propio registro de acceso. El acceso se usa únicamente en el contexto de una denuncia o revisión, no para curiosear. Los registros se conservan 2 AÑOS (ver apartado 6).',
        'El día que escribimos esta línea el registro de auditoría no tenía ninguna entrada: hasta hoy no ha habido ningún acceso de moderación. Esto no significa que el mecanismo no exista; está instalado y funciona, simplemente aún no ha hecho falta usarlo.',
      ],
    },
    {
      baslik: '5. Transferencia al extranjero',
      paragraflar: [
        'Los servidores de Supabase (base de datos y almacenamiento de archivos) están en Alemania (región eu-central-1). Todos tus datos personales se guardan fuera de Turquía, dentro de las fronteras de la Unión Europea.',
        "Los servidores de la Expo Push API (envío de notificaciones) están en Estados Unidos. Al enviar una notificación pasan por ahí el token de notificaciones de tu dispositivo, a quién se envía y el nombre de la persona que la provocó (por ejemplo 'Deniz te ha enviado un mensaje'). El texto del mensaje nunca se añade a la notificación, pero el nombre de otra persona también es un dato personal y forma parte de esta transferencia.",
        'El mapa base lo proporciona Apple Maps en iOS y Google Maps en Android. Al dibujar el mapa, las coordenadas de la región visible en pantalla van a ese proveedor; tu identidad, tu cuenta o tus check-ins no. La versión web no tiene mapa real, así que allí esta transferencia no ocurre.',
        'Base legal de la transferencia: las tres transferencias son necesarias para prestar el servicio, así que se apoyan en la misma base del apartado 2, la ejecución del contrato; el envío de notificaciones además entra en el interés legítimo.',
        'Queremos decirlo abiertamente: el artículo 9 de la KVKK exige, además de la base legal, un mecanismo de transferencia para las transferencias al extranjero (decisión de adecuación, contrato estándar, compromiso o consentimiento expreso). La Autoridad turca de Protección de Datos no tiene una decisión de adecuación que cubra estos países y nosotros tampoco tenemos hoy un contrato estándar firmado. Es una carencia abierta que debe resolverse antes de abrir la app a usuarios reales. Preferimos no presentar como existente un mecanismo que no existe.',
      ],
    },
    {
      baslik: '6. Plazos de conservación',
      paragraflar: [
        'Hoy hay en vigor más de una regla de borrado/limpieza automática (no una sola).',
        'Los registros de suspensión de cuenta caducados (de más de 90 días) se borran automáticamente de la base de datos cada día (borrado completo, sin archivar). Hoy no existe una copia de estos registros en otro sitio.',
        'En los registros que se guardan para calcular el límite diario de solicitudes de seguimiento/chat, las filas de más de 2 días se borran automáticamente cada día.',
        'Tus coordenadas de check-in (como se explica en el apartado 3) se borran automáticamente cuando el check-in se convierte en recuerdo.',
        'Los registros de acceso de la moderación (ver apartado 4) se conservan 2 AÑOS. Una tarea de limpieza que se ejecuta cada día a las 04:45 borra las filas más antiguas. Esta regla está hoy EN VIGOR.',
        'Para tus recuerdos (el resto de tu historial de check-ins), tus mensajes y las denuncias no hay hoy un borrado automático completo: se conservan indefinidamente. La aplicación completa del principio de "conservar solo el tiempo necesario" aún no está terminada.',
        'Previsto (aún no aplicado): borrar las denuncias resueltas 1 año después de la decisión. Hoy no existe una tarea de borrado automático para los registros de denuncias.',
        'Si bloqueas a un usuario: todos los mensajes individuales y la conversación entre vosotros, las solicitudes pendientes y la amistad se borran de forma permanente. El borrado se aplica en ambos lados y no se puede deshacer; desbloquear no recupera los mensajes borrados.',
        'Si eliminas tu cuenta: tu perfil, tus recuerdos, tus amigos y tu lista de conversaciones se borran de forma permanente. Los mensajes que enviaste no se borran, pero tu identidad como remitente se desvincula. En las denuncias que presentaste se corta el vínculo de identidad; en las denuncias sobre ti el vínculo NO se corta, la identidad del denunciado queda en el registro de moderación. Tus fotos de perfil y de check-in se borran del almacenamiento.',
      ],
    },
    {
      baslik: '7. Tus derechos',
      paragraflar: [
        'Puedes congelar tu cuenta. Tus datos no se borran, te vuelves invisible; cuando vuelvas a iniciar sesión tu cuenta se activa por sí sola.',
        'Puedes eliminar tu cuenta de forma permanente. No hay vuelta atrás; si quieres volver tendrás que crear una cuenta desde cero.',
        'Puedes descargar una copia de tus datos: Ajustes > Descargar mis datos. El archivo se prepara en formato JSON y se entrega con un enlace válido durante 24 horas; al caducar, el archivo deja de ser accesible y puedes volver a descargarlo.',
        'Lo que NO está en el archivo: las denuncias presentadas sobre ti (porque llevan la identidad de quien denuncia), el registro de auditoría de moderación, quién te ha bloqueado y el texto de los mensajes que has recibido. De los mensajes recibidos solo se incluye con quién, cuántos mensajes y cuándo fue el último: las frases del otro lado de una conversación son datos de esa persona.',
        'EL ARCHIVO QUE DESCARGAS LO PROTEGES TÚ. Contiene todo lo que hay en tu cuenta, incluido tu historial de ubicaciones; quien lo reciba de ti lo verá todo.',
        'Vía de solicitud: puedes enviar tus solicitudes a destek@slooin.com; tu solicitud se responde en un plazo máximo de 30 días.',
      ],
    },
  ],
  kosullar: [
    {
      baslik: '1. Partes',
      paragraflar: [
        'El responsable del tratamiento y operador de este servicio (Slooin) es Orçun Özdemir, como persona física. Este documento constituye el contrato entre el operador y toda persona que use la app Slooin.',
      ],
    },
    {
      baslik: '2. Límite de edad',
      paragraflar: [
        'Slooin es solo para usuarios que hayan cumplido 18 años. Una persona menor de 18 años no puede crear una cuenta. No existe una forma de uso restringida con autorización de los padres; Slooin se dirige a un único público, los usuarios adultos.',
      ],
    },
    {
      baslik: '3. Cuenta',
      paragraflar: [
        'Una persona solo puede crear una cuenta.',
        'Tu nombre de usuario es único y debe seguir un formato concreto (minúsculas, dígitos, punto y guion bajo; de 3 a 20 caracteres). Puedes cambiar tu nombre de usuario una vez cada 30 días.',
        'Mantener en secreto la contraseña que estableces para tu cuenta es responsabilidad tuya. Eres responsable de las acciones realizadas en tu cuenta si compartes tu contraseña o no la guardas de forma segura.',
      ],
    },
    {
      baslik: '4. Ubicación',
      paragraflar: [
        'Para que Slooin funcione se necesita tu ubicación: descubrir lugares cercanos, añadir lugares y hacer check-in dependen del acceso a la ubicación. El check-in es una acción tuya: a menos que quieras compartir en qué lugar estás, la app no te muestra automáticamente a otros usuarios. Cómo se trata tu ubicación y cuánto tiempo se conserva se explica en detalle en la Política de Privacidad.',
      ],
    },
    {
      baslik: '5. Conductas prohibidas',
      paragraflar: [
        'Al usar Slooin está prohibido lo siguiente: acoso, amenazas o cualquier conducta que moleste a otro usuario; crear cuentas falsas o hacerse pasar por otra persona; compartir la ubicación de otra persona fuera de la app sin su consentimiento; enviar mensajes masivos con fines comerciales (spam).',
        'Si se detecta una de estas conductas, se aplican las sanciones de moderación del apartado 7.',
      ],
    },
    {
      baslik: '6. Contenido',
      paragraflar: [
        'La nota y la foto que añades a un check-in son tuyas. Al compartirlas concedes a Slooin permiso para mostrar ese contenido dentro de la app (en el feed, en tu perfil, en la página del lugar correspondiente). La propiedad del contenido sigue siendo tuya.',
      ],
    },
    {
      baslik: '7. Moderación',
      paragraflar: [
        'Tras una denuncia, tu contenido (nota de check-in, foto o comentario) puede ocultarse. En caso de infracciones repetidas o graves, tu cuenta puede suspenderse temporalmente o prohibirse de forma permanente. Si quieres recurrir una decisión de moderación puedes escribirnos a destek@slooin.com.',
      ],
    },
    {
      baslik: '8. Cierre de la cuenta',
      paragraflar: [
        'Puedes congelar tu cuenta cuando quieras: tus datos no se borran y, cuando vuelvas a iniciar sesión, tu cuenta se reactiva por sí sola.',
        'Puedes eliminar tu cuenta de forma permanente. Esta acción no se puede deshacer; si quieres volver a usar la app tendrás que crear una cuenta desde cero. Qué se borra y qué queda (anonimizado) durante la eliminación se explica en la Política de Privacidad.',
      ],
    },
    {
      baslik: '9. Limitación de responsabilidad',
      paragraflar: [
        'Slooin es una herramienta que facilita que los usuarios compartan el mismo entorno a través de check-ins. El operador no es responsable de las consecuencias de que los usuarios se reúnan o interactúen entre sí.',
        'Los datos de lugares de la app (nombre, ubicación, tipo) proceden de fuentes de terceros (Foursquare y OpenStreetMap) y pueden contener errores. No es una renuncia abstracta: en la base de datos hay registros reales en los que el mismo lugar aparece varias veces con coordenadas erróneas; por ejemplo, hay registros separados llamados "Galata Kulesi" en Çekmeköy, Silivri y Büyükçekmece. Debes hacer tu propia valoración antes de dar por correcto el nombre, la ubicación o el tipo de un lugar.',
      ],
    },
    {
      baslik: '10. Cambios',
      paragraflar: ['Si estas condiciones cambian, el cambio se comunica dentro de la app.'],
    },
    {
      baslik: '11. Ley aplicable',
      paragraflar: ['Estas condiciones se rigen por el derecho de la República de Turquía.'],
    },
  ],
}

export default es
