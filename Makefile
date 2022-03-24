
db:
	@docker run --name pokemon-db -p 5432:5432 -e POSTGRES_PASSWORD=mysecretpassword --rm -d postgres

up:
	@${GOPATH}/bin/waypoint up -vvv -var r53_zone_id=Z01341463DFHBQT5WV4EK 2>&1 | tee up.txt

destroy:
	@${GOPATH}/bin/waypoint destroy -auto-approve -vvv -var r53_zone_id=Z01341463DFHBQT5WV4EK 2>&1 | tee destroy.txt