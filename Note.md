Remplacer la simulation d'envoi par un vrai appel à l'API (la ligne await new Promise(...) dans handleSubmit)
Gérer l'échec d'envoi : un état "error" avec un message « Le message n'a pas pu partir, réessayez » (aujourd'hui, l'envoi réussit toujours)
Revérifier les données côté serveur : les mêmes règles que validate(), plus le code postal
Une protection anti-spam : un champ piège invisible (« honeypot ») et une limite du nombre d'envois