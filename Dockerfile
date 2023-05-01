FROM ubuntu:18.04

RUN apt update

RUN apt install npm -y

#install node 12.22
RUN apt -y install curl dirmngr apt-transport-https lsb-release ca-certificates
RUN curl -sL https://deb.nodesource.com/setup_12.x | bash -
RUN apt install nodejs -y
RUN apt -y  install gcc g++ make

RUN node -v
# RUN nvm use 12.22

#Install tesseract
RUN apt-get install tesseract-ocr -y
COPY ./eng.traineddata /usr/share/tesseract-ocr/4.00/tessdata/
RUN ls /usr/share/tesseract-ocr/4.00/tessdata/

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY ./package.json /usr/src/app/
RUN npm install && npm cache clean --force
COPY ./ /usr/src/app

ENV TZ='Asia/Ho_Chi_Minh'
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
RUN echo haha
RUN echo "Asia/Ho_Chi_Minh" > /etc/timezone

ENV PORT 4001
EXPOSE 4001
CMD [ "npm", "start" ]
